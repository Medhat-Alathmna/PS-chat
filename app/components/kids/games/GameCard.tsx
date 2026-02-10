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
      className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-right bg-white/90 backdrop-blur-sm border-2 sm:border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl group w-full flex flex-col items-center sm:items-stretch h-full"
      style={{ borderColor: `${game.color}50` }}
    >
      {/* Category badge - Smaller on mobile */}
      <span
        className="absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium"
        style={{
          backgroundColor: `${category.color}20`,
          color: category.color,
        }}
      >
        {category.ar}
      </span>

      {/* Emoji - Larger on mobile for visual impact */}
      <span className="text-4xl sm:text-5xl block mb-1 sm:mb-2 mt-4 sm:mt-2 group-hover:animate-bounce-kids filter drop-shadow-sm">
        {game.emoji}
      </span>

      {/* Arabic name */}
      <h3 className="font-bold text-gray-800 text-sm sm:text-lg mb-0.5 sm:mb-1 text-center sm:text-right w-full truncate">
        {game.nameAr}
      </h3>

      {/* Description - Hiden on very small screens, shown on larger */}
      <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 text-center sm:text-right hidden xs:block">
        {game.descriptionAr}
      </p>

      {/* Color accent line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-1 rounded-full opacity-60"
        style={{ backgroundColor: game.color }}
      />
    </button>
  );
}
