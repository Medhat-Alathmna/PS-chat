"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/context/auth-context";
import { fetchBackendSettings, patchBackendSettings } from "@/lib/api/settings-fetch";
import type { ChatSettings, MessageDisplayMode, ReplyDialect } from "@/lib/types/chat-settings";

const STORAGE_KEY = "falastin_kids_chat_settings";

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY}_${profileId}` : STORAGE_KEY;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  displayMode: "streaming",
  dialect: "colloquial",
};

export function useChatSettings(profileId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef<Partial<ChatSettings>>({});

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
        setSettings({ ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_CHAT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_CHAT_SETTINGS);
    }

    if (isAuthenticated && profileId) {
      fetchBackendSettings(profileId)
        .then((data) => {
          if (!data?.chat) return;
          const merged = { ...DEFAULT_CHAT_SETTINGS, ...data.chat };
          setSettings(merged as ChatSettings);
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
    (next: ChatSettings) => {
      try {
        localStorage.setItem(getStorageKey(profileId), JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
    },
    [profileId]
  );

  const schedulePatch = useCallback(
    (partial: Partial<ChatSettings>) => {
      if (!isAuthenticated || !profileId) return;
      accumulatedRef.current = { ...accumulatedRef.current, ...partial };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(() => {
        const toSend = accumulatedRef.current;
        accumulatedRef.current = {};
        patchBackendSettings(profileId, "chat", toSend as Record<string, unknown>).catch(
          (err) => console.error("[useChatSettings] PATCH failed:", err)
        );
      }, 300);
    },
    [isAuthenticated, profileId]
  );

  const update = useCallback(
    (partial: Partial<ChatSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        persist(next);
        return next;
      });
      schedulePatch(partial);
    },
    [persist, schedulePatch]
  );

  const setDisplayMode = useCallback(
    (displayMode: MessageDisplayMode) => update({ displayMode }),
    [update]
  );

  const setDialect = useCallback(
    (dialect: ReplyDialect) => update({ dialect }),
    [update]
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_CHAT_SETTINGS);
    persist(DEFAULT_CHAT_SETTINGS);
    schedulePatch(DEFAULT_CHAT_SETTINGS);
  }, [persist, schedulePatch]);

  return {
    settings,
    isLoaded,
    setDisplayMode,
    setDialect,
    resetToDefaults,
  };
}
