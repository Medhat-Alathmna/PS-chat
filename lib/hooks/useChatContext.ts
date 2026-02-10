"use client";

import { useState, useCallback, useEffect } from "react";
import { KidsChatContext } from "@/lib/types/games";

const STORAGE_KEY_BASE = "falastin_kids_chat_context";
const MAX_TOPICS = 5;

function getStorageKey(profileId?: string): string {
  return profileId ? `${STORAGE_KEY_BASE}_${profileId}` : STORAGE_KEY_BASE;
}

function loadContext(profileId?: string): KidsChatContext {
  if (typeof window === "undefined") {
    return { recentTopics: [], lastUpdated: 0 };
  }
  try {
    const stored = localStorage.getItem(getStorageKey(profileId));
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { recentTopics: [], lastUpdated: 0 };
}

export function useChatContext(profileId?: string) {
  const [context, setContext] = useState<KidsChatContext>(() => loadContext(profileId));

  // Reload when profileId changes
  useEffect(() => {
    setContext(loadContext(profileId));
  }, [profileId]);

  // Persist
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(profileId), JSON.stringify(context));
    }
  }, [context, profileId]);

  const addTopic = useCallback((topic: string) => {
    setContext((prev) => {
      const topics = [topic, ...prev.recentTopics.filter((t) => t !== topic)].slice(
        0,
        MAX_TOPICS
      );
      return { recentTopics: topics, lastUpdated: Date.now() };
    });
  }, []);

  const getContext = useCallback((): KidsChatContext => {
    return context;
  }, [context]);

  return { context, addTopic, getContext };
}
