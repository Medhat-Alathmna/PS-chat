"use client";

import { useState, useCallback, useEffect } from "react";
import { KidsChatContext } from "@/lib/types/games";

const STORAGE_KEY = "falastin_kids_chat_context";
const MAX_TOPICS = 5;

function loadContext(): KidsChatContext {
  if (typeof window === "undefined") {
    return { recentTopics: [], lastUpdated: 0 };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return { recentTopics: [], lastUpdated: 0 };
}

export function useChatContext() {
  const [context, setContext] = useState<KidsChatContext>(loadContext);

  // Persist
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }
  }, [context]);

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
