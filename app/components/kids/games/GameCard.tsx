"use client";

import { GameConfig } from "@/lib/types/games";

const CATEGORY_LABELS: Record<string, { ar: string; color: string }> = {
  educational: { ar: "تعليمي", color: "#6C5CE7" },
  classic: { ar: "كلاسيكي", color: "#0984E3" },
  creative: { ar: "إبداعي", color: "#00B894" },
};

interface GameCardProps {
  game: GameConfig;
  onClick: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  const category = CATEGORY_LABELS[game.category];

  return (
    <button
      onClick={onClick}
      className="relative p-4 rounded-2xl text-right bg-white/90 backdrop-blur-sm border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
      style={{ borderColor: `${game.color}50` }}
    >
      {/* Emoji */}
      <span className="text-4xl block mb-2 group-hover:animate-bounce-kids">
        {game.emoji}
      </span>

      {/* Arabic name */}
      <h3 className="font-bold text-gray-700 text-sm mb-1">{game.nameAr}</h3>

      {/* Description */}
      <p className="text-xs text-gray-500 line-clamp-2">{game.descriptionAr}</p>

      {/* Category badge */}
      <span
        className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
        style={{
          backgroundColor: `${category.color}20`,
          color: category.color,
        }}
      >
        {category.ar}
      </span>

      {/* Color accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-1 rounded-full opacity-60"
        style={{ backgroundColor: game.color }}
      />
    </button>
  );
}
