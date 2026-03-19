"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { KidsProfile, ProfileAvatar, ProfileColor, ProfilesState } from "@/lib/types/games";

const PROFILES_KEY = "falastin_profiles";
const OLD_PROFILE_KEY = "falastin_kids_profile";
const OLD_REWARDS_KEY = "falastin_kids_rewards";
const OLD_CHAT_CONTEXT_KEY = "falastin_kids_chat_context";
const GAME_STATE_PREFIX = "falastin_game_state_";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadProfilesState(): ProfilesState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

function saveProfilesState(state: ProfilesState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILES_KEY, JSON.stringify(state));
}

/**
 * Migrate old single-profile data to the new multi-profile system.
 * Runs once — moves old keys to per-profile keys and removes the old ones.
 */
function migrateOldProfile(): ProfilesState | null {
  if (typeof window === "undefined") return null;

  try {
    const oldRaw = localStorage.getItem(OLD_PROFILE_KEY);
    if (!oldRaw) return null;

    const old = JSON.parse(oldRaw) as { age: number; createdAt: number };
    const id = generateId();

    const profile: KidsProfile = {
      id,
      name: "",
      age: old.age,
      avatar: "🌟",
      color: "purple",
      createdAt: old.createdAt || Date.now(),
    };

    // Migrate rewards
    const oldRewards = localStorage.getItem(OLD_REWARDS_KEY);
    if (oldRewards) {
      localStorage.setItem(`${OLD_REWARDS_KEY}_${id}`, oldRewards);
      localStorage.removeItem(OLD_REWARDS_KEY);
    }

    // Migrate chat context
    const oldContext = localStorage.getItem(OLD_CHAT_CONTEXT_KEY);
    if (oldContext) {
      localStorage.setItem(`${OLD_CHAT_CONTEXT_KEY}_${id}`, oldContext);
      localStorage.removeItem(OLD_CHAT_CONTEXT_KEY);
    }

    // Migrate game states (falastin_game_state_*)
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GAME_STATE_PREFIX)) {
        const gameId = key.slice(GAME_STATE_PREFIX.length);
        if (!gameId.includes("_")) {
          keysToMigrate.push(key);
        }
      }
    }
    for (const key of keysToMigrate) {
      const gameId = key.slice(GAME_STATE_PREFIX.length);
      const val = localStorage.getItem(key);
      if (val) {
        localStorage.setItem(`${GAME_STATE_PREFIX}${id}_${gameId}`, val);
        localStorage.removeItem(key);
      }
    }

    localStorage.removeItem(OLD_PROFILE_KEY);

    const state: ProfilesState = {
      profiles: [profile],
      activeProfileId: id,
    };
    saveProfilesState(state);
    return state;
  } catch {
    return null;
  }
}

/** Backend profile shape returned by NestJS */
interface BackendProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  color: string;
  createdAt: string;
}

function toKidsProfile(p: BackendProfile): KidsProfile {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    avatar: p.avatar as ProfileAvatar,
    color: p.color as ProfileColor,
    createdAt: new Date(p.createdAt).getTime(),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/profiles${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Backend ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const EMPTY_STATE: ProfilesState = { profiles: [], activeProfileId: null };

export function useProfiles() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [state, setState] = useState<ProfilesState>(EMPTY_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  // Load profiles — from backend if authenticated, localStorage otherwise
  const load = useCallback(async (authenticated: boolean) => {
    if (authenticated) {
      try {
        const profiles = await apiFetch<BackendProfile[]>("");
        const mapped = profiles.map(toKidsProfile);
        // Preserve activeProfileId from localStorage if it still exists
        const cached = loadProfilesState();
        const activeId =
          cached?.activeProfileId && mapped.find((p) => p.id === cached.activeProfileId)
            ? cached.activeProfileId
            : mapped[0]?.id ?? null;
        const next: ProfilesState = { profiles: mapped, activeProfileId: activeId };
        setState(next);
        saveProfilesState(next);
      } catch {
        // Fallback to localStorage on error
        const cached = loadProfilesState();
        setState(cached || EMPTY_STATE);
      }
    } else {
      let loaded = loadProfilesState();
      if (!loaded) loaded = migrateOldProfile();
      setState(loaded || EMPTY_STATE);
    }
    setIsLoaded(true);
  }, []);

  // Initial load — wait for auth to resolve
  useEffect(() => {
    if (authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(isAuthenticated);
  }, [authLoading, isAuthenticated, load]);

  // Persist activeProfileId changes to localStorage (for both modes)
  useEffect(() => {
    if (isLoaded) {
      saveProfilesState(state);
    }
  }, [state, isLoaded]);

  const activeProfile = state.profiles.find((p) => p.id === state.activeProfileId) || null;

  const createProfile = useCallback(
    async (data: { name: string; age: number; avatar: ProfileAvatar; color: ProfileColor }) => {
      if (isAuthenticated) {
        const created = await apiFetch<BackendProfile>("", {
          method: "POST",
          body: JSON.stringify(data),
        });
        const profile = toKidsProfile(created);
        setState((prev) => ({
          profiles: [...prev.profiles, profile],
          activeProfileId: profile.id,
        }));
        return profile;
      } else {
        // localStorage-only path
        const id = generateId();
        const profile: KidsProfile = { id, ...data, createdAt: Date.now() };
        setState((prev) => ({
          profiles: [...prev.profiles, profile],
          activeProfileId: id,
        }));
        return profile;
      }
    },
    [isAuthenticated]
  );

  const updateProfile = useCallback(
    async (id: string, updates: Partial<Pick<KidsProfile, "name" | "age" | "avatar" | "color">>) => {
      if (isAuthenticated) {
        await apiFetch(`/${id}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      }
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    },
    [isAuthenticated]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      if (isAuthenticated) {
        await apiFetch(`/${id}`, { method: "DELETE" });
      }

      // Clean up per-profile localStorage data
      if (typeof window !== "undefined") {
        localStorage.removeItem(`falastin_kids_rewards_${id}`);
        localStorage.removeItem(`falastin_kids_chat_context_${id}`);
        localStorage.removeItem(`falastin_kids_map_settings_${id}`);
        localStorage.removeItem(`falastin_stories_${id}`);
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${GAME_STATE_PREFIX}${id}_`)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          localStorage.removeItem(key);
        }
      }

      setState((prev) => {
        const remaining = prev.profiles.filter((p) => p.id !== id);
        return {
          profiles: remaining,
          activeProfileId:
            prev.activeProfileId === id
              ? remaining[0]?.id || null
              : prev.activeProfileId,
        };
      });
    },
    [isAuthenticated]
  );

  const switchProfile = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeProfileId: id }));
  }, []);

  return {
    profiles: state.profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
  };
}

/**
 * Standalone utility for non-React contexts (e.g., API routes).
 * Returns the active profile or null.
 */
export function getActiveProfile(): KidsProfile | null {
  const state = loadProfilesState();
  if (!state) return null;
  return state.profiles.find((p) => p.id === state.activeProfileId) || null;
}
