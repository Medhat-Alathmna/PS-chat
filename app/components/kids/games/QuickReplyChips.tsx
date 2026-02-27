"use client";

export interface SuggestionChip {
  text: string;
  type: "photo" | "map" | "curiosity" | "activity";
  actionQuery?: string;
}

export interface QuickReplyData {
  suggestions: SuggestionChip[];
}

interface QuickReplyChipsProps {
  data: QuickReplyData;
  onChipClick: (chip: SuggestionChip) => void;
  onHintClick: () => void;
  disabled?: boolean;
}

/**
 * Normalize suggestions — handles both new typed format and old plain-string format.
 * Plain strings become curiosity chips for backward compatibility.
 */
export function normalizeSuggestions(
  raw: unknown[]
): SuggestionChip[] {
  return raw.map((item) => {
    if (typeof item === "string") {
      return { text: item, type: "curiosity" as const };
    }
    const obj = item as Record<string, unknown>;
    return {
      text: (obj.text as string) || "",
      type: (obj.type as SuggestionChip["type"]) || "curiosity",
      actionQuery: obj.actionQuery as string | undefined,
    };
  });
}

const CHIP_STYLES: Record<
  SuggestionChip["type"],
  { emoji: string; bg: string; border: string; hover: string; gradient: string }
> = {
  photo: {
    emoji: "\uD83D\uDCF8",
    bg: "bg-blue-50",
    border: "border-blue-300",
    hover: "hover:bg-blue-100 hover:border-blue-400",
    gradient: "from-blue-400/5 to-transparent",
  },
  map: {
    emoji: "\uD83D\uDDFA\uFE0F",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    hover: "hover:bg-emerald-100 hover:border-emerald-400",
    gradient: "from-emerald-400/5 to-transparent",
  },
  curiosity: {
    emoji: "\uD83D\uDCA1",
    bg: "bg-purple-50",
    border: "border-purple-300",
    hover: "hover:bg-purple-100 hover:border-purple-400",
    gradient: "from-purple-400/5 to-transparent",
  },
  activity: {
    emoji: "\uD83C\uDFA8",
    bg: "bg-orange-50",
    border: "border-orange-300",
    hover: "hover:bg-orange-100 hover:border-orange-400",
    gradient: "from-orange-400/5 to-transparent",
  },
};

export default function QuickReplyChips({
  data,
  onChipClick,
  onHintClick,
  disabled,
}: QuickReplyChipsProps) {
  return (
    <div className="flex flex-col gap-2 animate-pop-in">
      <div className="grid gap-2">
        {data.suggestions.map((chip, i) => {
          const style = CHIP_STYLES[chip.type] || CHIP_STYLES.curiosity;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChipClick(chip)}
              disabled={disabled}
              className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-3xl text-right transition-all shadow-md ${style.bg} border-2 ${style.border} text-gray-800 ${style.hover} hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer overflow-hidden`}
              dir="auto"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <span className="text-xl shrink-0 filter drop-shadow-sm">{style.emoji}</span>
              <span className="text-base sm:text-lg font-bold leading-relaxed">{chip.text}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
