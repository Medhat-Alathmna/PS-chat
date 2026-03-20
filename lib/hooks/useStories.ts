"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import type {
  SavedStory,
  StoryConfig,
  StoryPage,
  StoryChoicePoint,
  StoryGenre,
  StoryCompanion,
  StoryLength,
  StoryMode,
} from "@/lib/types/stories";

// ── localStorage helpers (guest mode) ───────────────────────────────────────

const STORAGE_PREFIX = "falastin_stories";

function getStorageKey(profileId: string): string {
  return `${STORAGE_PREFIX}_${profileId}`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadStories(profileId: string): SavedStory[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(getStorageKey(profileId));
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

function persistStories(profileId: string, stories: SavedStory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(profileId), JSON.stringify(stories));
  } catch {
    // localStorage full or unavailable
  }
}

// ── Backend API helpers (authenticated mode) ────────────────────────────────

interface BackendStory {
  id: string;
  profileId: string;
  genre: string;
  companion: string;
  length: string;
  mode: string;
  setting: string | null;
  titleAr: string | null;
  pages: StoryPage[];
  choicePoints: StoryChoicePoint[];
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

function toSavedStory(s: BackendStory): SavedStory {
  return {
    id: s.id,
    profileId: s.profileId,
    config: {
      genre: s.genre as StoryGenre,
      companion: s.companion as StoryCompanion,
      length: s.length as StoryLength,
      mode: s.mode as StoryMode,
      ...(s.setting ? { setting: s.setting as SavedStory["config"]["setting"] } : {}),
    },
    titleAr: s.titleAr ?? undefined,
    pages: s.pages ?? [],
    choicePoints: s.choicePoints ?? [],
    completed: s.completed,
    createdAt: new Date(s.createdAt).getTime(),
    completedAt: s.completedAt ? new Date(s.completedAt).getTime() : undefined,
  };
}

async function storiesApiFetch<T>(
  profileId: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/profiles/${profileId}/stories${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  // 401 — attempt token refresh then retry once
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshRes.ok) {
      const retry = await fetch(`/api/profiles/${profileId}/stories${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!retry.ok) {
        const body = await retry.text();
        throw new Error(`Backend ${retry.status}: ${body}`);
      }
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
    throw new Error("Token refresh failed");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Backend ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useStories(profileId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref to track latest stories for debounced PATCH (avoids stale closures)
  const storiesRef = useRef<SavedStory[]>(stories);
  useEffect(() => {
    storiesRef.current = stories;
  }, [stories]);

  // Debounced PATCH timer ref
  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── localStorage persist (guest mode only) ──
  const persist = useCallback(
    (next: SavedStory[]) => {
      if (profileId && !isAuthenticated) persistStories(profileId, next);
    },
    [profileId, isAuthenticated]
  );

  // ── Load stories ──
  const load = useCallback(
    async (authenticated: boolean) => {
      if (!profileId) {
        setStories([]);
        setIsLoaded(true);
        return;
      }

      if (authenticated) {
        // Try localStorage cache for instant startup
        const cached = loadStories(profileId);
        if (cached.length > 0) {
          setStories(cached);
          setIsLoaded(true);
        }
        // Fetch from backend
        try {
          const backendStories = await storiesApiFetch<BackendStory[]>(profileId, "");
          const mapped = backendStories.map(toSavedStory);
          setStories(mapped);
          persistStories(profileId, mapped); // cache for next startup
        } catch (err) {
          console.error("[useStories] Backend fetch failed:", err);
          // Fall back to cached if backend fails
          if (cached.length === 0) {
            setStories(loadStories(profileId));
          }
        }
      } else {
        setStories(loadStories(profileId));
      }
      setIsLoaded(true);
    },
    [profileId]
  );

  // Initial load — wait for auth to resolve
  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(isAuthenticated);
  }, [authLoading, isAuthenticated, load]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    };
  }, []);

  // ── Debounced PATCH for incremental updates ──
  const schedulePatch = useCallback(
    (storyId: string) => {
      if (!isAuthenticated || !profileId) return;
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(async () => {
        const story = storiesRef.current.find((s) => s.id === storyId);
        if (!story) return;
        try {
          await storiesApiFetch(profileId, `/${storyId}`, {
            method: "PATCH",
            body: JSON.stringify({
              pages: story.pages,
              choicePoints: story.choicePoints,
            }),
          });
        } catch (err) {
          console.error("[useStories] Debounced PATCH failed:", err);
        }
      }, 300);
    },
    [isAuthenticated, profileId]
  );

  // ── Mutations ──

  const createStory = useCallback(
    async (config: StoryConfig): Promise<string> => {
      if (isAuthenticated && profileId) {
        // POST to backend — backend generates UUID
        const created = await storiesApiFetch<BackendStory>(profileId, "", {
          method: "POST",
          body: JSON.stringify({
            genre: config.genre,
            companion: config.companion,
            length: config.length,
            mode: config.mode,
            setting: config.setting,
          }),
        });
        const story = toSavedStory(created);
        setStories((prev) => [story, ...prev]);
        return story.id;
      } else {
        // Guest mode — local UUID
        const id = generateId();
        const story: SavedStory = {
          id,
          profileId: profileId || "",
          config,
          pages: [],
          choicePoints: [],
          completed: false,
          createdAt: Date.now(),
        };
        setStories((prev) => {
          const next = [story, ...prev];
          persist(next);
          return next;
        });
        return id;
      }
    },
    [isAuthenticated, profileId, persist]
  );

  const addPage = useCallback(
    (storyId: string, page: StoryPage) => {
      setStories((prev) => {
        const next = prev.map((s) => {
          if (s.id !== storyId) return s;
          // Avoid duplicate pages
          if (s.pages.some((p) => p.pageNumber === page.pageNumber)) return s;
          return { ...s, pages: [...s.pages, page] };
        });
        persist(next);
        return next;
      });
      schedulePatch(storyId);
    },
    [persist, schedulePatch]
  );

  const addChoicePoint = useCallback(
    (storyId: string, choicePoint: StoryChoicePoint) => {
      setStories((prev) => {
        const next = prev.map((s) => {
          if (s.id !== storyId) return s;
          // Avoid duplicate choice points at same page
          if (s.choicePoints.some((cp) => cp.afterPage === choicePoint.afterPage))
            return s;
          return { ...s, choicePoints: [...s.choicePoints, choicePoint] };
        });
        persist(next);
        return next;
      });
      schedulePatch(storyId);
    },
    [persist, schedulePatch]
  );

  const selectChoice = useCallback(
    (storyId: string, afterPage: number, choiceId: string) => {
      setStories((prev) => {
        const next = prev.map((s) => {
          if (s.id !== storyId) return s;
          return {
            ...s,
            choicePoints: s.choicePoints.map((cp) =>
              cp.afterPage === afterPage
                ? { ...cp, selectedChoiceId: choiceId }
                : cp
            ),
          };
        });
        persist(next);
        return next;
      });
      schedulePatch(storyId);
    },
    [persist, schedulePatch]
  );

  const completeStory = useCallback(
    async (storyId: string, titleAr: string) => {
      // Flush any pending debounced PATCH first
      if (patchTimerRef.current) {
        clearTimeout(patchTimerRef.current);
        patchTimerRef.current = null;
      }

      setStories((prev) => {
        const next = prev.map((s) => {
          if (s.id !== storyId) return s;
          return {
            ...s,
            titleAr,
            completed: true,
            completedAt: Date.now(),
          };
        });
        persist(next);
        return next;
      });

      if (isAuthenticated && profileId) {
        try {
          // Send final state: pages + choicePoints + completion
          const story = storiesRef.current.find((s) => s.id === storyId);
          await storiesApiFetch(profileId, `/${storyId}`, {
            method: "PATCH",
            body: JSON.stringify({
              pages: story?.pages ?? [],
              choicePoints: story?.choicePoints ?? [],
              titleAr,
              completed: true,
            }),
          });
        } catch (err) {
          console.error("[useStories] completeStory PATCH failed:", err);
        }
      }
    },
    [isAuthenticated, profileId, persist]
  );

  const deleteStory = useCallback(
    async (storyId: string) => {
      setStories((prev) => {
        const next = prev.filter((s) => s.id !== storyId);
        persist(next);
        return next;
      });

      if (isAuthenticated && profileId) {
        try {
          await storiesApiFetch(profileId, `/${storyId}`, { method: "DELETE" });
        } catch (err) {
          console.error("[useStories] DELETE failed:", err);
        }
      }
    },
    [isAuthenticated, profileId, persist]
  );

  const getStory = useCallback(
    (storyId: string): SavedStory | undefined => {
      return stories.find((s) => s.id === storyId);
    },
    [stories]
  );

  const completedStories = stories.filter((s) => s.completed);

  return {
    stories,
    completedStories,
    isLoaded,
    createStory,
    addPage,
    addChoicePoint,
    selectChoice,
    completeStory,
    deleteStory,
    getStory,
  };
}
