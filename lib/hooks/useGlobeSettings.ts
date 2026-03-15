"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [settings, setSettings] = useState<GlobeSettings>(DEFAULT_GLOBE_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        setSettings({ ...DEFAULT_GLOBE_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_GLOBE_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_GLOBE_SETTINGS);
    }
    setIsLoaded(true);
  }, [profileId]);

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

  const update = useCallback(
    (partial: Partial<GlobeSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return {
    settings,
    isLoaded,
    setAppearance: (appearance: GlobeAppearance) => update({ appearance }),
    setAutoRotate: (autoRotate: boolean) => update({ autoRotate }),
    setRotationSpeed: (rotationSpeed: number) => update({ rotationSpeed }),
    setShowCountryLabels: (showCountryLabels: boolean) => update({ showCountryLabels }),
    setSpaceBackground: (spaceBackground: SpaceBackground) => update({ spaceBackground }),
    resetToDefaults: () => { setSettings(DEFAULT_GLOBE_SETTINGS); persist(DEFAULT_GLOBE_SETTINGS); },
  };
}
