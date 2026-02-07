"use client";

import { useMemo } from "react";
import { RewardLevel } from "@/lib/types";
import { REWARD_LEVELS } from "@/lib/hooks/useRewards";

interface RewardsBarProps {
  points: number;
  level: RewardLevel;
  progress: number;
  unlockedStickersCount: number;
  totalStickersCount: number;
  pointsEarned?: number;
  onOpenStickers?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  className?: string;
}

/**
 * Rewards bar showing points, level, and stickers progress
 */
export default function RewardsBar({
  points,
  level,
  progress,
  unlockedStickersCount,
  totalStickersCount,
  pointsEarned = 0,
  onOpenStickers,
  soundEnabled = true,
  onToggleSound,
  className = "",
}: RewardsBarProps) {
  // Next level info
  const nextLevel = useMemo(() => {
    const currentIndex = REWARD_LEVELS.findIndex((l) => l.id === level.id);
    return REWARD_LEVELS[currentIndex + 1] || null;
  }, [level.id]);

  return (
    <div
      className={`
        bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg
        px-4 py-3 flex items-center gap-4
        border-2 border-[var(--kids-yellow)]/30
        ${className}
      `}
    >
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-3xl animate-pulse-grow"
          style={{ animationDuration: "3s" }}
        >
          {level.icon}
        </span>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-500 leading-tight">المستوى</p>
          <p
            className="text-sm font-bold leading-tight"
            style={{ color: level.color }}
          >
            {level.nameAr}
          </p>
        </div>
      </div>

      {/* Points & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-[var(--kids-orange)]">
              {points}
            </span>
            <span className="text-sm text-gray-500">⭐</span>

            {/* Points earned animation */}
            {pointsEarned > 0 && (
              <span className="text-sm font-bold text-[var(--kids-green)] animate-pop-in ml-1">
                +{pointsEarned}!
              </span>
            )}
          </div>

          {nextLevel && (
            <span className="text-xs text-gray-400 hidden sm:block">
              {nextLevel.minPoints - points} للمستوى التالي
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${level.color}, var(--kids-orange))`,
            }}
          />
        </div>
      </div>

      {/* Stickers button */}
      <button
        onClick={onOpenStickers}
        className="
          flex items-center gap-1 px-3 py-2
          bg-[var(--kids-purple)] text-white
          rounded-xl text-sm font-bold
          hover:scale-105 active:scale-95
          transition-transform shadow-md
        "
      >
        <span>🎯</span>
        <span className="hidden sm:inline">ملصقات</span>
        <span className="bg-white/20 px-1.5 rounded-lg text-xs">
          {unlockedStickersCount}/{totalStickersCount}
        </span>
      </button>

      {/* Sound toggle */}
      {onToggleSound && (
        <button
          onClick={onToggleSound}
          className="
            w-10 h-10 flex items-center justify-center
            bg-gray-100 rounded-xl text-xl
            hover:bg-gray-200 active:scale-95
            transition-all
          "
          aria-label={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      )}
    </div>
  );
}

/**
 * Compact rewards indicator for mobile
 */
export function CompactRewardsBar({
  points,
  level,
  onOpenStickers,
  className = "",
}: {
  points: number;
  level: RewardLevel;
  onOpenStickers?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2
        bg-white/80 backdrop-blur-sm rounded-full shadow-md
        ${className}
      `}
    >
      <span className="text-xl">{level.icon}</span>
      <span className="font-bold text-[var(--kids-orange)]">{points} ⭐</span>
      <button
        onClick={onOpenStickers}
        className="text-xl hover:scale-110 active:scale-95 transition-transform"
      >
        🎯
      </button>
    </div>
  );
}

/**
 * Points earned popup animation
 */
export function PointsPopup({
  points,
  show,
}: {
  points: number;
  show: boolean;
}) {
  if (!show || points <= 0) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="animate-pop-in">
        <div
          className="
            bg-gradient-to-r from-[var(--kids-yellow)] to-[var(--kids-orange)]
            text-white text-4xl font-bold
            px-8 py-4 rounded-2xl shadow-2xl
            flex items-center gap-2
          "
        >
          <span>+{points}</span>
          <span className="animate-bounce-kids">⭐</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Level up celebration
 */
export function LevelUpCelebration({
  level,
  show,
  onDismiss,
}: {
  level: RewardLevel;
  show: boolean;
  onDismiss: () => void;
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="animate-pop-in bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-6xl block mb-4 animate-bounce-kids">
          {level.icon}
        </span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: level.color }}>
          مبروك! 🎉
        </h2>
        <p className="text-xl font-bold text-gray-700 mb-1">
          وصلت لمستوى
        </p>
        <p className="text-2xl font-bold mb-4" style={{ color: level.color }}>
          {level.nameAr}
        </p>
        <button
          onClick={onDismiss}
          className="
            px-6 py-3 bg-[var(--kids-green)] text-white
            rounded-xl font-bold text-lg
            hover:scale-105 active:scale-95 transition-transform
          "
        >
          يلا نكمل! 🚀
        </button>
      </div>
    </div>
  );
}
