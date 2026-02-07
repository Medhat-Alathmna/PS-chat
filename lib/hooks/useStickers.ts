"use client";

import { useState, useCallback, useMemo } from "react";
import { Sticker, StickerCategory, UnlockedSticker } from "@/lib/types";
import { ALL_STICKERS } from "@/lib/data/stickers";

// Points needed to unlock a new sticker
const POINTS_PER_STICKER = 50;

export function useStickers(
  unlockedStickers: UnlockedSticker[],
  onUnlock: (stickerId: string) => void
) {
  const [selectedCategory, setSelectedCategory] =
    useState<StickerCategory | "all">("all");
  const [showCollection, setShowCollection] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);

  // Get stickers by category
  const stickersByCategory = useMemo(() => {
    const grouped: Record<StickerCategory | "all", Sticker[]> = {
      all: ALL_STICKERS,
      cities: ALL_STICKERS.filter((s) => s.category === "cities"),
      food: ALL_STICKERS.filter((s) => s.category === "food"),
      heritage: ALL_STICKERS.filter((s) => s.category === "heritage"),
    };
    return grouped;
  }, []);

  // Get currently displayed stickers
  const displayedStickers = useMemo(() => {
    return stickersByCategory[selectedCategory];
  }, [selectedCategory, stickersByCategory]);

  // Check if a sticker is unlocked
  const isStickerUnlocked = useCallback(
    (stickerId: string) => {
      return unlockedStickers.some((s) => s.stickerId === stickerId);
    },
    [unlockedStickers]
  );

  // Get unlocked stickers count
  const unlockedCount = useMemo(() => {
    return unlockedStickers.length;
  }, [unlockedStickers]);

  // Get total stickers count
  const totalCount = useMemo(() => {
    return ALL_STICKERS.length;
  }, []);

  // Get completion percentage
  const completionPercentage = useMemo(() => {
    return Math.round((unlockedCount / totalCount) * 100);
  }, [unlockedCount, totalCount]);

  // Check if user can unlock a new sticker based on points
  const canUnlockNew = useCallback(
    (currentPoints: number) => {
      const possibleUnlocks = Math.floor(currentPoints / POINTS_PER_STICKER);
      return possibleUnlocks > unlockedCount;
    },
    [unlockedCount]
  );

  // Unlock a random sticker from a specific category or any
  const unlockRandomSticker = useCallback(
    (category?: StickerCategory) => {
      const availableStickers = (
        category ? stickersByCategory[category] : ALL_STICKERS
      ).filter((s) => !isStickerUnlocked(s.id));

      if (availableStickers.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * availableStickers.length);
      const sticker = availableStickers[randomIndex];

      setNewlyUnlocked(sticker.id);
      onUnlock(sticker.id);

      // Clear newly unlocked after animation
      setTimeout(() => setNewlyUnlocked(null), 3000);

      return sticker;
    },
    [stickersByCategory, isStickerUnlocked, onUnlock]
  );

  // Get sticker by ID
  const getStickerById = useCallback((stickerId: string) => {
    return ALL_STICKERS.find((s) => s.id === stickerId) || null;
  }, []);

  // Get recently unlocked stickers (last 5)
  const recentlyUnlocked = useMemo(() => {
    return [...unlockedStickers]
      .sort((a, b) => b.unlockedAt - a.unlockedAt)
      .slice(0, 5)
      .map((u) => getStickerById(u.stickerId))
      .filter(Boolean) as Sticker[];
  }, [unlockedStickers, getStickerById]);

  // Category labels
  const categoryLabels: Record<StickerCategory | "all", { en: string; ar: string }> = {
    all: { en: "All", ar: "الكل" },
    cities: { en: "Cities", ar: "المدن" },
    food: { en: "Food", ar: "الطعام" },
    heritage: { en: "Heritage", ar: "التراث" },
  };

  return {
    // State
    selectedCategory,
    showCollection,
    newlyUnlocked,
    displayedStickers,

    // Counts
    unlockedCount,
    totalCount,
    completionPercentage,

    // Actions
    setSelectedCategory,
    setShowCollection,
    isStickerUnlocked,
    canUnlockNew,
    unlockRandomSticker,
    getStickerById,
    recentlyUnlocked,

    // Data
    stickersByCategory,
    categoryLabels,
    POINTS_PER_STICKER,
  };
}
