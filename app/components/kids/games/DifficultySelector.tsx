"use client";

import { GameDifficulty } from "@/lib/types/games";
import AnimatedMascot from "../AnimatedMascot";

interface DifficultySelectorProps {
  onSelect: (difficulty: GameDifficulty) => void;
}

const DIFFICULTIES: {
  id: GameDifficulty;
  label: string;
  stars: string;
  color: string;
  description: string;
}[] = [
    {
      id: "easy",
      label: "سهل",
      stars: "⭐",
      color: "#00B894",
      description: "للمبتدئين",
    },
    {
      id: "medium",
      label: "متوسط",
      stars: "⭐⭐",
      color: "#FDCB6E",
      description: "تحدي خفيف",
    },
    {
      id: "hard",
      label: "صعب",
      stars: "⭐⭐⭐",
      color: "#E17055",
      description: "للأبطال!",
    },
  ];

export default function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full">
      <div className="mb-4 sm:mb-6">
        {/* Use a smaller mascot on mobile */}
        <div className="sm:hidden">
          <AnimatedMascot state="waving" size="md" />
        </div>
        <div className="hidden sm:block">
          <AnimatedMascot state="waving" size="lg" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text text-center">
        اختار المستوى! 🎯
      </h2>
      <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 text-center">قديش بدك التحدي؟</p>

      <div className="flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            onClick={() => onSelect(diff.id)}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 border-2 sm:border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            style={{ borderColor: `${diff.color}50` }}
          >
            <span className="text-xl sm:text-2xl shrink-0">{diff.stars}</span>
            <div className="text-right flex-1 min-w-0">
              <div className="font-bold text-sm sm:text-base text-gray-700 truncate">{diff.label}</div>
              <div className="text-[10px] sm:text-xs text-gray-500 truncate">{diff.description}</div>
            </div>
            <span
              className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-bold text-white shrink-0"
              style={{ backgroundColor: diff.color }}
            >
              يلا!
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
