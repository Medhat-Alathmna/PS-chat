"use client";

import type { StoryChoice } from "@/lib/types/stories";

interface StoryChoiceCardsProps {
  prompt: string;
  choices: StoryChoice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
  selectedId?: string;
}

export default function StoryChoiceCards({
  prompt,
  choices,
  onSelect,
  disabled,
  selectedId,
}: StoryChoiceCardsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-6">
      {/* Prompt */}
      <h2
        className="text-white text-lg sm:text-xl font-bold text-center mb-6 max-w-md"
        dir="rtl"
      >
        {prompt}
      </h2>

      {/* Choice cards */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {choices.map((choice, index) => {
          const isSelected = selectedId === choice.id;
          return (
            <button
              key={choice.id}
              onClick={() => !disabled && onSelect(choice.id)}
              disabled={disabled}
              className={`
                relative p-4 rounded-2xl text-right border-2 transition-all duration-300
                ${
                  isSelected
                    ? "bg-white/30 border-white/60 scale-105 shadow-lg"
                    : disabled
                      ? "bg-white/5 border-white/10 opacity-50"
                      : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95"
                }
              `}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: "fadeInUp 0.4s ease-out both",
              }}
              dir="rtl"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl shrink-0">{choice.emoji}</span>
                <span className="text-white font-medium text-base leading-relaxed">
                  {choice.textAr}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-2 left-2 text-white/80 text-lg">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
