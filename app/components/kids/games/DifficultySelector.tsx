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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="mb-6">
        <AnimatedMascot state="waving" size="lg" />
      </div>

      <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2 bubble-text">
        اختار المستوى! 🎯
      </h2>
      <p className="text-gray-500 mb-8">قديش بدك التحدي؟</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            onClick={() => onSelect(diff.id)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/90 border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            style={{ borderColor: `${diff.color}50` }}
          >
            <span className="text-2xl">{diff.stars}</span>
            <div className="text-right flex-1">
              <div className="font-bold text-gray-700">{diff.label}</div>
              <div className="text-xs text-gray-500">{diff.description}</div>
            </div>
            <span
              className="text-xs px-3 py-1 rounded-full font-bold text-white"
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
