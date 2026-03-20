"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { fetchBackendSettings, patchBackendSettings } from "@/lib/api/settings-fetch";
import type {
  GlobeSettings,
  GlobeAppearance,
  SpaceBackground,
} from "@/lib/types/globe-settings";
import { DEFAULT_GLOBE_SETTINGS } from "@/lib/types/globe-settings";

const STORAGE_KEY = "falastin_kids_globe_settings";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

export function useGlobeSettings(profileId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [settings, setSettings] = useState<GlobeSettings>(DEFAULT_GLOBE_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef<Partial<GlobeSettings>>({});

  useEffect(() => {
    return () => {
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    };
  }, []);

  // Load: show localStorage immediately, then override with backend if authenticated
  useEffect(() => {
    if (authLoading) return;

    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({ ...DEFAULT_GLOBE_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_GLOBE_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_GLOBE_SETTINGS);
    }

    if (isAuthenticated && profileId) {
      fetchBackendSettings(profileId)
        .then((data) => {
          if (!data?.globe) return;
          const merged = { ...DEFAULT_GLOBE_SETTINGS, ...data.globe };
          setSettings(merged as GlobeSettings);
          try {
            localStorage.setItem(getStorageKey(profileId), JSON.stringify(merged));
          } catch {
            // ignore
          }
        })
        .finally(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
  }, [authLoading, isAuthenticated, profileId]);

  const persist = useCallback(
    (next: GlobeSettings) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [profileId]
  );

  const schedulePatch = useCallback(
    (partial: Partial<GlobeSettings>) => {
      if (!isAuthenticated || !profileId) return;
      accumulatedRef.current = { ...accumulatedRef.current, ...partial };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(() => {
        const toSend = accumulatedRef.current;
        accumulatedRef.current = {};
        patchBackendSettings(profileId, "globe", toSend as Record<string, unknown>).catch(
          (err) => console.error("[useGlobeSettings] PATCH failed:", err)
        );
      }, 300);
    },
    [isAuthenticated, profileId]
  );

  const update = useCallback(
    (partial: Partial<GlobeSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
      schedulePatch(partial);
    },
    [persist, schedulePatch]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_GLOBE_SETTINGS);
    persist(DEFAULT_GLOBE_SETTINGS);
    schedulePatch(DEFAULT_GLOBE_SETTINGS);
  }, [persist, schedulePatch]);

  return {
    settings,
    isLoaded,
    setAppearance: (appearance: GlobeAppearance) => update({ appearance }),
    setAutoRotate: (autoRotate: boolean) => update({ autoRotate }),
    setRotationSpeed: (rotationSpeed: number) => update({ rotationSpeed }),
    setSpaceBackground: (spaceBackground: SpaceBackground) => update({ spaceBackground }),
    setSelectedCountryColor: (selectedCountryColor: string) => update({ selectedCountryColor }),
    resetToDefaults,
  };
}
