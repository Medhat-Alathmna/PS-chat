"use client";

import { GameConfig, GameState, GameDifficulty } from "@/lib/types/games";
import VoiceToggle from "../VoiceToggle";
import { useBackgroundMusicContext } from "@/app/kids/layout";

const DIFFICULTY_LABELS: Record<GameDifficulty, { ar: string; stars: string; color: string }> = {
  easy: { ar: "سهل", stars: "⭐", color: "#00B894" },
  medium: { ar: "متوسط", stars: "⭐⭐", color: "#FDCB6E" },
  hard: { ar: "صعب", stars: "⭐⭐⭐", color: "#E17055" },
};

interface GameHeaderProps {
  config: GameConfig;
  state: GameState;
  onBack: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  isSpeaking?: boolean;
  voiceSupported?: boolean;
}

export default function GameHeader({
  config,
  state,
  onBack,
  voiceEnabled,
  onToggleVoice,
  isSpeaking = false,
  voiceSupported = false,
}: GameHeaderProps) {
  const diffLabel = state.difficulty ? DIFFICULTY_LABELS[state.difficulty] : null;

  // Get background music context for controlling music
  const backgroundMusic = useBackgroundMusicContext();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-md border border-[var(--kids-purple)]/10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-base sm:text-lg"
        aria-label="رجوع"
      >
        <span className="transform -scale-x-100">➜</span>
      </button>

      {/* Game info */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2">
        <span className="text-base sm:text-lg shrink-0">{config.emoji}</span>
        <div className="min-w-0 flex flex-col justify-center">
          <h2 className="font-bold text-xs sm:text-sm text-gray-800 truncate leading-tight">
            {config.nameAr}
          </h2>
          {diffLabel && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs text-gray-400 leading-tight hidden sm:inline">Normal</span>
              <span
                className="text-[10px] sm:text-xs px-1.5 py-0 rounded-full font-medium inline-flex items-center"
                style={{
                  backgroundColor: `${diffLabel.color}15`,
                  color: diffLabel.color,
                }}
              >
                {diffLabel.ar}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 px-1 sm:px-2 border-r border-l border-gray-100 mx-1">
        {/* Round counter */}
        <div className="text-center">
          <div className="text-[10px] text-gray-400 hidden sm:block">جولة</div>
          <div className="font-bold text-xs sm:text-sm text-[var(--kids-purple)] flex items-center gap-0.5">
            <span className="sm:hidden text-[10px]">🔄</span>
            {state.round}
            {typeof state.totalRounds === "number" && <span className="opacity-60 text-[10px] sm:text-xs">/{state.totalRounds}</span>}
          </div>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-[10px] text-gray-400 hidden sm:block">نقاط</div>
          <div className="font-bold text-xs sm:text-sm text-[var(--kids-orange)] flex items-center gap-0.5">
            <span className="sm:hidden text-[10px]">⭐</span>
            {state.score}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Voice toggle */}
        {onToggleVoice && voiceSupported && (
          <VoiceToggle
            voiceEnabled={!!voiceEnabled}
            onToggle={onToggleVoice}
            isSpeaking={isSpeaking}
            isSupported={voiceSupported}
            className="w-8 h-8 sm:w-9 sm:h-9 text-base sm:text-lg border border-gray-100"
          />
        )}

        {/* Music toggle - controls background music */}
        <button
          onClick={backgroundMusic.toggle}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all text-sm sm:text-base"
          aria-label={backgroundMusic.isPlaying ? "كتم الموسيقى" : "تشغيل الموسيقى"}
        >
          {backgroundMusic.isPlaying ? "🔊" : "🔇"}
        </button>
      </div>
    </div>
  );
}
