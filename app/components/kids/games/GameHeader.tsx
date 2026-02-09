"use client";

import { GameConfig, GameState, GameDifficulty } from "@/lib/types/games";

const DIFFICULTY_LABELS: Record<GameDifficulty, { ar: string; stars: string; color: string }> = {
  easy: { ar: "سهل", stars: "⭐", color: "#00B894" },
  medium: { ar: "متوسط", stars: "⭐⭐", color: "#FDCB6E" },
  hard: { ar: "صعب", stars: "⭐⭐⭐", color: "#E17055" },
};

interface GameHeaderProps {
  config: GameConfig;
  state: GameState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBack: () => void;
}

export default function GameHeader({
  config,
  state,
  soundEnabled,
  onToggleSound,
  onBack,
}: GameHeaderProps) {
  const diffLabel = state.difficulty ? DIFFICULTY_LABELS[state.difficulty] : null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md">
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all text-lg"
        aria-label="رجوع"
      >
        →
      </button>

      {/* Game info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{config.emoji}</span>
          <h2 className="font-bold text-sm text-gray-700 truncate">{config.nameAr}</h2>
          {diffLabel && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: `${diffLabel.color}20`,
                color: diffLabel.color,
              }}
            >
              {diffLabel.stars}
            </span>
          )}
        </div>
      </div>

      {/* Round counter */}
      <div className="text-center px-2">
        <div className="text-xs text-gray-500">جولة</div>
        <div className="font-bold text-sm text-[var(--kids-purple)]">
          {state.round}
          {typeof state.totalRounds === "number" && `/${state.totalRounds}`}
        </div>
      </div>

      {/* Score */}
      <div className="text-center px-2 border-r border-gray-200">
        <div className="text-xs text-gray-500">نقاط</div>
        <div className="font-bold text-sm text-[var(--kids-orange)]">
          {state.score} ⭐
        </div>
      </div>

      {/* Sound toggle */}
      <button
        onClick={onToggleSound}
        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
        aria-label={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
