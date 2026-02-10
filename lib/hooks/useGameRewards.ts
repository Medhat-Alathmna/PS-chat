"use client";

import { useCallback } from "react";
import { useRewards } from "./useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { GameSessionSummary } from "@/lib/types/games";
import { getGameConfig } from "@/lib/data/games";

export function useGameRewards(profileId?: string) {
  const rewards = useRewards(profileId);
  const stickers = useStickers(rewards.unlockedStickers, rewards.unlockSticker);

  const onCorrectAnswer = useCallback(
    (gameId: string, points: number) => {
      rewards.addPoints(points, `game_correct_${gameId}`);
    },
    [rewards]
  );

  const onRoundComplete = useCallback(
    (gameId: string, points: number) => {
      rewards.addPoints(points, `game_round_${gameId}`);
    },
    [rewards]
  );

  const onGameComplete = useCallback(
    (summary: GameSessionSummary) => {
      const config = getGameConfig(summary.gameId);

      // Add bonus points if earned
      if (summary.bonusEarned) {
        rewards.addPoints(config.bonusPoints, `game_bonus_${summary.gameId}`);
      }

      // Unlock sticker if threshold met
      if (summary.stickerUnlocked && stickers.canUnlockNew(rewards.points)) {
        stickers.unlockRandomSticker();
      }
    },
    [rewards, stickers]
  );

  return {
    ...rewards,
    stickers,
    onCorrectAnswer,
    onRoundComplete,
    onGameComplete,
  };
}
