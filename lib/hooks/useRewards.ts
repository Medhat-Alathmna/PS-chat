"use client";

import { useState, useEffect, useCallback } from "react";
import { RewardState, RewardLevel, UnlockedSticker } from "@/lib/types";

// Reward levels configuration
export const REWARD_LEVELS: RewardLevel[] = [
  {
    id: "explorer",
    name: "Little Explorer",
    nameAr: "مستكشف صغير",
    minPoints: 0,
    maxPoints: 50,
    icon: "🌟",
    color: "#FFE66D",
  },
  {
    id: "friend",
    name: "Friend of Palestine",
    nameAr: "صديق فلسطين",
    minPoints: 51,
    maxPoints: 150,
    icon: "⭐",
    color: "#54A0FF",
  },
  {
    id: "hero",
    name: "Palestine Hero",
    nameAr: "بطل فلسطين",
    minPoints: 151,
    maxPoints: 300,
    icon: "🏆",
    color: "#FF9F43",
  },
  {
    id: "knight",
    name: "Knight of Jerusalem",
    nameAr: "فارس القدس",
    minPoints: 301,
    maxPoints: Infinity,
    icon: "👑",
    color: "#FFD700",
  },
];

// Points configuration
export const POINTS_CONFIG = {
  firstMessage: 10,
  fiveMessages: 20,
  cityQuestion: 15,
  historyQuestion: 15,
  foodQuestion: 10,
  dailyBonus: 25,
};

const STORAGE_KEY = "falastin_kids_rewards";

function getLevelForPoints(points: number): RewardLevel {
  return (
    REWARD_LEVELS.find(
      (level) => points >= level.minPoints && points <= level.maxPoints
    ) || REWARD_LEVELS[0]
  );
}

function getInitialState(): RewardState {
  if (typeof window === "undefined") {
    return {
      points: 0,
      level: REWARD_LEVELS[0],
      messagesCount: 0,
      unlockedStickers: [],
      lastRewardAt: null,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        level: getLevelForPoints(parsed.points),
      };
    }
  } catch (e) {
    console.warn("[useRewards] Failed to load from localStorage:", e);
  }

  return {
    points: 0,
    level: REWARD_LEVELS[0],
    messagesCount: 0,
    unlockedStickers: [],
    lastRewardAt: null,
  };
}

export function useRewards() {
  const [state, setState] = useState<RewardState>(getInitialState);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Add points
  const addPoints = useCallback((amount: number, reason?: string) => {
    setPointsEarned(amount);
    setState((prev) => {
      const newPoints = prev.points + amount;
      const newLevel = getLevelForPoints(newPoints);
      const leveledUp = newLevel.id !== prev.level.id;

      if (leveledUp) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        lastRewardAt: Date.now(),
      };
    });

    // Reset points earned display after animation
    setTimeout(() => setPointsEarned(0), 2000);
  }, []);

  // Increment messages count and award points
  const recordMessage = useCallback(() => {
    setState((prev) => {
      const newCount = prev.messagesCount + 1;
      let bonusPoints = 0;

      // First message bonus
      if (newCount === 1) {
        bonusPoints = POINTS_CONFIG.firstMessage;
      }
      // Every 5 messages bonus
      else if (newCount % 5 === 0) {
        bonusPoints = POINTS_CONFIG.fiveMessages;
      }

      if (bonusPoints > 0) {
        setPointsEarned(bonusPoints);
        setTimeout(() => setPointsEarned(0), 2000);
      }

      const newPoints = prev.points + bonusPoints;
      const newLevel = getLevelForPoints(newPoints);

      return {
        ...prev,
        messagesCount: newCount,
        points: newPoints,
        level: newLevel,
        lastRewardAt: bonusPoints > 0 ? Date.now() : prev.lastRewardAt,
      };
    });
  }, []);

  // Add sticker to collection
  const unlockSticker = useCallback((stickerId: string) => {
    setState((prev) => {
      // Check if already unlocked
      if (prev.unlockedStickers.some((s) => s.stickerId === stickerId)) {
        return prev;
      }

      const newSticker: UnlockedSticker = {
        stickerId,
        unlockedAt: Date.now(),
      };

      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      return {
        ...prev,
        unlockedStickers: [...prev.unlockedStickers, newSticker],
      };
    });
  }, []);

  // Check if a sticker is unlocked
  const isStickerUnlocked = useCallback(
    (stickerId: string) => {
      return state.unlockedStickers.some((s) => s.stickerId === stickerId);
    },
    [state.unlockedStickers]
  );

  // Calculate progress to next level
  const progressToNextLevel = useCallback(() => {
    const currentLevel = state.level;
    const nextLevel = REWARD_LEVELS.find(
      (l) => l.minPoints > currentLevel.maxPoints
    );

    if (!nextLevel) {
      return 100; // Max level
    }

    const pointsInLevel = state.points - currentLevel.minPoints;
    const levelRange = currentLevel.maxPoints - currentLevel.minPoints;

    return Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
  }, [state.points, state.level]);

  // Reset all progress (for testing or user request)
  const resetProgress = useCallback(() => {
    setState({
      points: 0,
      level: REWARD_LEVELS[0],
      messagesCount: 0,
      unlockedStickers: [],
      lastRewardAt: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    // State
    points: state.points,
    level: state.level,
    messagesCount: state.messagesCount,
    unlockedStickers: state.unlockedStickers,
    showCelebration,
    pointsEarned,

    // Actions
    addPoints,
    recordMessage,
    unlockSticker,
    isStickerUnlocked,
    progressToNextLevel,
    resetProgress,

    // Constants
    REWARD_LEVELS,
    POINTS_CONFIG,
  };
}
