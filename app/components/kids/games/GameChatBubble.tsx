"use client";

import { useMemo } from "react";
import AnimatedMascot from "../AnimatedMascot";

interface GameChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  answerResult?: { correct: boolean; explanation: string } | null;
  hintData?: { hint: string; hintNumber: number } | null;
}

const ASSISTANT_COLORS = [
  "#6C5CE7", "#0984E3", "#00B894", "#E17055", "#FDCB6E",
];

export default function GameChatBubble({
  role,
  content,
  isStreaming,
  answerResult,
  hintData,
}: GameChatBubbleProps) {
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
          </div>
        )}
      </div>
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
