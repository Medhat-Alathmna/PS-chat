"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { fetchBackendSettings, patchBackendSettings } from "@/lib/api/settings-fetch";
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
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_TEXT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef<Partial<TextSettings>>({});

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    };
  }, []);

  // Load: show localStorage immediately, then override with backend if authenticated
  useEffect(() => {
    if (authLoading) return;

    // Instant startup from localStorage
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({ ...DEFAULT_TEXT_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_TEXT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_TEXT_SETTINGS);
    }

    if (isAuthenticated && profileId) {
      fetchBackendSettings(profileId)
        .then((data) => {
          if (!data?.text) return;
          const merged = { ...DEFAULT_TEXT_SETTINGS, ...data.text };
          setSettings(merged as TextSettings);
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

  // Persist to localStorage
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

  // Debounced PATCH — accumulates rapid changes into a single request
  const schedulePatch = useCallback(
    (partial: Partial<TextSettings>) => {
      if (!isAuthenticated || !profileId) return;
      accumulatedRef.current = { ...accumulatedRef.current, ...partial };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(() => {
        const toSend = accumulatedRef.current;
        accumulatedRef.current = {};
        patchBackendSettings(profileId, "text", toSend as Record<string, unknown>).catch(
          (err) => console.error("[useTextSettings] PATCH failed:", err)
        );
      }, 300);
    },
    [isAuthenticated, profileId]
  );

  const update = useCallback(
    (partial: Partial<TextSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
      schedulePatch(partial);
    },
    [persist, schedulePatch]
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
    schedulePatch(DEFAULT_TEXT_SETTINGS);
  }, [persist, schedulePatch]);

  return {
    settings,
    isLoaded,
    setFontFamily,
    setTextSize,
    resetToDefaults,
  };
}
