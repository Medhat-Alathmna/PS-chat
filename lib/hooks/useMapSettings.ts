"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { fetchBackendSettings, patchBackendSettings } from "@/lib/api/settings-fetch";
import type {
  MapSettings,
  InfoDisplayMode,
  MarkerStyle,
  MapTheme,
  AnimationLevel,
} from "@/lib/types/map-settings";

const STORAGE_KEY = "falastin_kids_map_settings";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  infoDisplayMode: "popup",
  markerStyle: "pin",
  mapTheme: "light",
  showCityLabels: true,
  showRegionBorders: true,
  animationLevel: "full",
};

export function useMapSettings(profileId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef<Partial<MapSettings>>({});

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
        setSettings({ ...DEFAULT_MAP_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_MAP_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_MAP_SETTINGS);
    }

    if (isAuthenticated && profileId) {
      fetchBackendSettings(profileId)
        .then((data) => {
          if (!data?.map) return;
          const merged = { ...DEFAULT_MAP_SETTINGS, ...data.map };
          setSettings(merged as MapSettings);
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
    (next: MapSettings) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
    },
    [profileId]
  );

  const schedulePatch = useCallback(
    (partial: Partial<MapSettings>) => {
      if (!isAuthenticated || !profileId) return;
      accumulatedRef.current = { ...accumulatedRef.current, ...partial };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(() => {
        const toSend = accumulatedRef.current;
        accumulatedRef.current = {};
        patchBackendSettings(profileId, "map", toSend as Record<string, unknown>).catch(
          (err) => console.error("[useMapSettings] PATCH failed:", err)
        );
      }, 300);
    },
    [isAuthenticated, profileId]
  );

  const update = useCallback(
    (partial: Partial<MapSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
      schedulePatch(partial);
    },
    [persist, schedulePatch]
  );

  const setInfoDisplayMode = useCallback(
    (infoDisplayMode: InfoDisplayMode) => update({ infoDisplayMode }),
    [update]
  );

  const setMarkerStyle = useCallback(
    (markerStyle: MarkerStyle) => update({ markerStyle }),
    [update]
  );

  const setMapTheme = useCallback(
    (mapTheme: MapTheme) => update({ mapTheme }),
    [update]
  );

  const setShowCityLabels = useCallback(
    (showCityLabels: boolean) => update({ showCityLabels }),
    [update]
  );

  const setShowRegionBorders = useCallback(
    (showRegionBorders: boolean) => update({ showRegionBorders }),
    [update]
  );

  const setAnimationLevel = useCallback(
    (animationLevel: AnimationLevel) => update({ animationLevel }),
    [update]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_MAP_SETTINGS);
    persist(DEFAULT_MAP_SETTINGS);
    schedulePatch(DEFAULT_MAP_SETTINGS);
  }, [persist, schedulePatch]);

  return {
    settings,
    isLoaded,
    setInfoDisplayMode,
    setMarkerStyle,
    setMapTheme,
    setShowCityLabels,
    setShowRegionBorders,
    setAnimationLevel,
    resetToDefaults,
  };
}
