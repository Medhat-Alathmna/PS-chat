"use client";

import { useState } from "react";
import { Sticker, StickerCategory, UnlockedSticker } from "@/lib/types";
import { ALL_STICKERS } from "@/lib/data/stickers";

interface StickerCollectionProps {
  unlockedStickers: UnlockedSticker[];
  newlyUnlocked?: string | null;
  onClose: () => void;
  onSelectSticker?: (sticker: Sticker) => void;
}

type CategoryFilter = StickerCategory | "all";

const CATEGORY_INFO: Record<
  CategoryFilter,
  { label: string; emoji: string; color: string }
> = {
  all: { label: "الكل", emoji: "🎯", color: "#A55EEA" },
  cities: { label: "المدن", emoji: "🏙️", color: "#54A0FF" },
  food: { label: "الطعام", emoji: "🍽️", color: "#FF9F43" },
  heritage: { label: "التراث", emoji: "🏛️", color: "#4ECDC4" },
};

/**
 * Sticker collection modal/panel for kids
 */
export default function StickerCollection({
  unlockedStickers,
  newlyUnlocked,
  onClose,
  onSelectSticker,
}: StickerCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");

  // Filter stickers by category
  const filteredStickers =
    selectedCategory === "all"
      ? ALL_STICKERS
      : ALL_STICKERS.filter((s) => s.category === selectedCategory);

  // Check if sticker is unlocked
  const isUnlocked = (stickerId: string) =>
    unlockedStickers.some((s) => s.stickerId === stickerId);

  // Calculate stats
  const unlockedCount = unlockedStickers.length;
  const totalCount = ALL_STICKERS.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="
          bg-white rounded-3xl shadow-2xl
          w-full max-w-lg max-h-[85vh]
          overflow-hidden flex flex-col
          animate-pop-in
        "
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🎯</span>
              مجموعة الملصقات
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className="bg-white/20 rounded-full p-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--kids-yellow)] rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-bold whitespace-nowrap">
                {unlockedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 p-3 border-b overflow-x-auto no-scrollbar">
          {(Object.keys(CATEGORY_INFO) as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-xl
                text-sm font-bold whitespace-nowrap
                transition-all
                ${
                  selectedCategory === cat
                    ? "text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
              style={{
                backgroundColor:
                  selectedCategory === cat
                    ? CATEGORY_INFO[cat].color
                    : undefined,
              }}
            >
              <span>{CATEGORY_INFO[cat].emoji}</span>
              <span>{CATEGORY_INFO[cat].label}</span>
            </button>
          ))}
        </div>

        {/* Stickers grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3">
            {filteredStickers.map((sticker) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                isUnlocked={isUnlocked(sticker.id)}
                isNew={newlyUnlocked === sticker.id}
                onClick={() => onSelectSticker?.(sticker)}
              />
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="p-3 bg-gray-50 text-center text-sm text-gray-500">
          اجمع 50 نقطة ⭐ لفتح ملصق جديد!
        </div>
      </div>
    </div>
  );
}

/**
 * Individual sticker card
 */
function StickerCard({
  sticker,
  isUnlocked,
  isNew,
  onClick,
}: {
  sticker: Sticker;
  isUnlocked: boolean;
  isNew: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className={`
        relative aspect-square rounded-2xl
        flex flex-col items-center justify-center
        p-2 transition-all
        ${
          isUnlocked
            ? "bg-white border-2 border-[var(--kids-yellow)] shadow-md hover:scale-110 active:scale-95"
            : "bg-gray-200 border-2 border-gray-300 opacity-60"
        }
        ${isNew ? "animate-pop-in ring-4 ring-[var(--kids-yellow)]" : ""}
      `}
    >
      {/* Emoji */}
      <span className={`text-3xl ${isUnlocked ? "" : "grayscale"}`}>
        {isUnlocked ? sticker.emoji : "🔒"}
      </span>

      {/* Name */}
      <span
        className={`
          text-[10px] font-bold mt-1 text-center leading-tight
          ${isUnlocked ? "text-gray-700" : "text-gray-400"}
        `}
      >
        {isUnlocked ? sticker.nameAr : "???"}
      </span>

      {/* New badge */}
      {isNew && (
        <span className="absolute -top-1 -right-1 bg-[var(--kids-red)] text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
          جديد!
        </span>
      )}
    </button>
  );
}

/**
 * Sticker unlocked celebration popup
 */
export function StickerUnlockedPopup({
  sticker,
  show,
  onDismiss,
}: {
  sticker: Sticker | null;
  show: boolean;
  onDismiss: () => void;
}) {
  if (!show || !sticker) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-xs animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4 animate-bounce-kids">{sticker.emoji}</div>
        <h3 className="text-xl font-bold text-[var(--kids-purple)] mb-2">
          ملصق جديد! 🎉
        </h3>
        <p className="text-2xl font-bold text-gray-700 mb-1">{sticker.nameAr}</p>
        <p className="text-gray-500 text-sm mb-4">{sticker.descriptionAr}</p>
        <button
          onClick={onDismiss}
          className="
            px-6 py-3 bg-[var(--kids-green)] text-white
            rounded-xl font-bold
            hover:scale-105 active:scale-95 transition-transform
          "
        >
          رائع! 🌟
        </button>
      </div>
    </div>
  );
}
