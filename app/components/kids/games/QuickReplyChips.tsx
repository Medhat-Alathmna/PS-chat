"use client";

export interface QuickReplyData {
  suggestions: string[];
  showHintChip: boolean;
}

interface QuickReplyChipsProps {
  data: QuickReplyData;
  onChipClick: (text: string) => void;
  onHintClick: () => void;
  disabled?: boolean;
}

const SUGGESTION_EMOJIS = ["💬", "🌟", "📸", "🗺️", "➡️"];

export default function QuickReplyChips({
  data,
  onChipClick,
  onHintClick,
  disabled,
}: QuickReplyChipsProps) {
  return (
    <div className="flex flex-col gap-2 animate-pop-in">
      <div className="grid gap-2">
        {data.suggestions.map((text, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChipClick(text)}
            disabled={disabled}
            className="group relative flex items-center gap-3 px-5 py-3.5 rounded-3xl text-right transition-all shadow-md bg-white border-2 border-[var(--kids-green)]/20 text-gray-800 hover:bg-emerald-50 hover:border-[var(--kids-green)] hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer overflow-hidden"
            dir="auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--kids-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl shrink-0 filter drop-shadow-sm">{SUGGESTION_EMOJIS[i] || "💬"}</span>
            <span className="text-base sm:text-lg font-bold leading-relaxed">{text}</span>
          </button>
        ))}
      </div>

      {data.showHintChip && (
        <button
          type="button"
          onClick={onHintClick}
          disabled={disabled}
          className="self-center mt-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer shadow-sm"
        >
          <span className="text-xl">💡</span>
          <span>أحتاج مساعدة (تلميح)</span>
        </button>
      )}
    </div>
  );
}
