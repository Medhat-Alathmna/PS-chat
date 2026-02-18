"use client";

import { useState, useCallback, useEffect } from "react";
import type { TextSettings, FontFamily, TextSize } from "@/lib/types/text-settings";

const STORAGE_KEY = "falastin_kids_text_settings";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  fontFamily: "noto-sans-arabic",
  textSize: "medium",
};

const FONT_CSS_MAP: Record<FontFamily, string> = {
  "noto-sans-arabic": "var(--font-arabic)",
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
  changa: "var(--font-changa)",
};

const SIZE_CSS_MAP: Record<TextSize, string> = {
  small: "14px",
  medium: "17px",
  large: "21px",
};

export function getTextStyleValues(settings: TextSettings): {
  fontFamily: string;
  fontSize: string;
} {
  return {
    fontFamily: FONT_CSS_MAP[settings.fontFamily],
    fontSize: SIZE_CSS_MAP[settings.textSize],
  };
}

export function useTextSettings(profileId?: string) {
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_TEXT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_TEXT_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_TEXT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_TEXT_SETTINGS);
    }
    setIsLoaded(true);
  }, [profileId]);

  // Persist helper
  const persist = useCallback(
    (next: TextSettings) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
    },
    [profileId]
  );

  const update = useCallback(
    (partial: Partial<TextSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setFontFamily = useCallback(
    (fontFamily: FontFamily) => update({ fontFamily }),
    [update]
  );

  const setTextSize = useCallback(
    (textSize: TextSize) => update({ textSize }),
    [update]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_TEXT_SETTINGS);
    persist(DEFAULT_TEXT_SETTINGS);
  }, [persist]);

  return {
    settings,
    isLoaded,
    setFontFamily,
    setTextSize,
    resetToDefaults,
  };
}
