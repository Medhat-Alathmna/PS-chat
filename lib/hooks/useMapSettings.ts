"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_MAP_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_MAP_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_MAP_SETTINGS);
    }
    setIsLoaded(true);
  }, [profileId]);

  // Persist helper
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

  const update = useCallback(
    (partial: Partial<MapSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
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
  }, [persist]);

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
