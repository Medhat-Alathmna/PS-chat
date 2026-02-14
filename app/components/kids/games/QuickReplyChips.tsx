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

export default function QuickReplyChips({
  data,
  onChipClick,
  onHintClick,
  disabled,
}: QuickReplyChipsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide animate-fade-in">
      {data.suggestions.map((text, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChipClick(text)}
          disabled={disabled}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-bold bg-white border-2 border-[var(--kids-purple)]/30 text-[var(--kids-purple)] hover:bg-purple-50 hover:border-[var(--kids-purple)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-sm cursor-pointer"
          dir="auto"
        >
          {text}
        </button>
      ))}

      {data.showHintChip && (
        <button
          type="button"
          onClick={onHintClick}
          disabled={disabled}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-bold bg-yellow-50 border-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-sm cursor-pointer"
        >
          تلميح 💡
        </button>
      )}
    </div>
  );
}
