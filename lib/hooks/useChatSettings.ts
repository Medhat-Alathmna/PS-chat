"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatSettings, MessageDisplayMode } from "@/lib/types/chat-settings";

const STORAGE_KEY = "falastin_kids_chat_settings";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  displayMode: "streaming",
};

export function useChatSettings(profileId?: string) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(profileId));
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_CHAT_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_CHAT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_CHAT_SETTINGS);
    }
    setIsLoaded(true);
  }, [profileId]);

  const persist = useCallback(
    (next: ChatSettings) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
    },
    [profileId]
  );

  const setDisplayMode = useCallback(
    (displayMode: MessageDisplayMode) => {
      setSettings((prev) => {
        const next = { ...prev, displayMode };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_CHAT_SETTINGS);
    persist(DEFAULT_CHAT_SETTINGS);
  }, [persist]);

  return {
    settings,
    isLoaded,
    setDisplayMode,
    resetToDefaults,
  };
}
