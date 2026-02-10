"use client";

import { useMemo, useState } from "react";
import { ImageResult } from "@/lib/types";
import AnimatedMascot from "../AnimatedMascot";
import SpeakingIndicator from "../SpeakingIndicator";

export interface OptionsData {
  options: string[];
  allowHint: boolean;
}

interface GameChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  answerResult?: { correct: boolean; explanation: string } | null;
  hintData?: { hint: string; hintNumber: number; images?: ImageResult[] } | null;
  optionsData?: OptionsData | null;
  isActiveOptions?: boolean;
  onOptionClick?: (optionNumber: number) => void;
  onHintClick?: () => void;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
}

const ASSISTANT_COLORS = [
  "#6C5CE7", "#0984E3", "#00B894", "#E17055", "#FDCB6E",
];

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

export default function GameChatBubble({
  role,
  content,
  isStreaming,
  answerResult,
  hintData,
  optionsData,
  isActiveOptions = false,
  onOptionClick,
  onHintClick,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
}: GameChatBubbleProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const bgColor = useMemo(
    () => ASSISTANT_COLORS[Math.floor(Math.random() * ASSISTANT_COLORS.length)],
    []
  );

  if (role === "user") {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[80%] bg-gradient-to-br from-[var(--kids-green)] to-emerald-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
          <p className="text-sm leading-relaxed" dir="auto">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start animate-fade-in-up">
      <AnimatedMascot
        state={isStreaming ? "thinking" : "happy"}
        size="sm"
        className="shrink-0 mt-1"
      />
      <div className="max-w-[85%] flex flex-col gap-2">
        {/* Main message */}
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-md"
          style={{ backgroundColor: `${bgColor}15`, border: `2px solid ${bgColor}30` }}
        >
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap" dir="auto">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[var(--kids-purple)] rounded-full animate-pulse ml-1 align-middle" />
            )}
          </p>
        </div>

        {/* Answer result overlay */}
        {answerResult && (
          <div
            className={`px-4 py-3 rounded-2xl shadow-md animate-pop-in ${
              answerResult.correct
                ? "bg-green-50 border-2 border-green-300"
                : "bg-orange-50 border-2 border-orange-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">
                {answerResult.correct ? "✅" : "❌"}
              </span>
              <span className="font-bold text-sm">
                {answerResult.correct ? "أحسنت! 🎉" : "حاول مرة تانية! 💪"}
              </span>
            </div>
            <p className="text-xs text-gray-600" dir="auto">
              {answerResult.explanation}
            </p>
          </div>
        )}

        {/* Hint bubble */}
        {hintData && (
          <div className="px-4 py-3 rounded-2xl shadow-md bg-yellow-50 border-2 border-yellow-300 animate-pop-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💡</span>
              <span className="font-bold text-xs text-yellow-700">
                تلميح {hintData.hintNumber}
              </span>
            </div>
            <p className="text-xs text-gray-600" dir="auto">
              {hintData.hint}
            </p>
            {hintData.images && hintData.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {hintData.images.slice(0, 2).map((img, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl overflow-hidden border-2 border-yellow-200 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
                    onClick={() => setExpandedImage(img.imageUrl || img.thumbnailUrl)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.thumbnailUrl || img.imageUrl}
                      alt={img.title}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Old options (grayed out) — active options are rendered separately at the bottom */}
        {optionsData && !isActiveOptions && (
          <div className="flex flex-wrap gap-1.5 opacity-40">
            {optionsData.options.map((option, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-gray-50 border border-gray-200 text-gray-400"
                dir="auto"
              >
                <span className="text-sm">{NUMBER_EMOJIS[i]}</span>
                <span>{option}</span>
              </span>
            ))}
          </div>
        )}

        {/* Speaking indicator */}
        {!isStreaming && onSpeak && (
          <div className="flex">
            <SpeakingIndicator
              isSpeaking={isSpeaking}
              onToggle={isSpeaking ? () => onStopSpeaking?.() : () => onSpeak()}
            />
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl transition-colors"
            onClick={() => setExpandedImage(null)}
            aria-label="إغلاق"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage}
            alt="صورة مكبّرة"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export function GameTypingBubble() {
  return (
    <div className="flex gap-2 items-start animate-fade-in">
      <AnimatedMascot state="thinking" size="sm" className="shrink-0 mt-1" />
      <div className="px-4 py-3 bg-white/80 rounded-2xl rounded-tl-sm shadow-md">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
