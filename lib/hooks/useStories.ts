"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  SavedStory,
  StoryConfig,
  StoryPage,
  StoryChoicePoint,
} from "@/lib/types/stories";

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

export function useStories(profileId?: string) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (!profileId) {
      setStories([]);
      setIsLoaded(true);
      return;
    }
    setStories(loadStories(profileId));
    setIsLoaded(true);
  }, [profileId]);

  // Persist helper
  const persist = useCallback(
    (next: SavedStory[]) => {
      if (profileId) persistStories(profileId, next);
    },
    [profileId]
  );

  const createStory = useCallback(
    (config: StoryConfig): string => {
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
    },
    [profileId, persist]
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
    },
    [persist]
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
    },
    [persist]
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
    },
    [persist]
  );

  const completeStory = useCallback(
    (storyId: string, titleAr: string) => {
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
    },
    [persist]
  );

  const deleteStory = useCallback(
    (storyId: string) => {
      setStories((prev) => {
        const next = prev.filter((s) => s.id !== storyId);
        persist(next);
        return next;
      });
    },
    [persist]
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
