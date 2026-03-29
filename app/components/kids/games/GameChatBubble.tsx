"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageResult } from "@/lib/types";
import SpeakingIndicator from "../SpeakingIndicator";
import { formatKidsMessageWithIcons } from "../KidsChatBubble";

interface GameChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  hintData?: { hint: string; hintNumber: number; images?: ImageResult[] } | null;
  imageResults?: ImageResult[] | null;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  textStyle?: { fontFamily: string; fontSize: string };
  className?: string;
}

const ASSISTANT_COLORS = [
  "#6C5CE7", "#0984E3", "#00B894", "#E17055", "#FDCB6E",
];

export default function GameChatBubble({
  role,
  content,
  isStreaming,
  hintData,
  imageResults,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
  textStyle,
  className,
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
          <p className="leading-relaxed" dir="auto" style={textStyle}>{content}</p>
        </div>
      </div>
    );
  }

  // Skip rendering entirely if there's nothing visible to show
  const hasText = content.trim().length > 0;
  const hasImages = imageResults && imageResults.length > 0;
  const hasVisibleContent = hasText || isStreaming || hasImages || hintData;

  if (!hasVisibleContent) return null;

  return (
    <div className={`flex gap-2 items-start ${className ?? "animate-fade-in-up"}`}>
      <div className="max-w-[85%] flex flex-col gap-2">
        {/* Main message - only render if there's text content, images, or streaming */}
        {(hasText || isStreaming || hasImages) && (
          <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-md"
            style={{ backgroundColor: `${bgColor}15`, border: `2px solid ${bgColor}30` }}
          >
            <div dir="rtl" style={textStyle}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="leading-relaxed text-gray-700 mb-1">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-800">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-600">{children}</em>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-1 mt-0" style={{ color: bgColor }}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-0.5 mt-1.5" style={{ color: bgColor }}>{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-gray-700 mb-1 space-y-0.5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-gray-700 mb-1 space-y-0.5">{children}</ol>
                  ),
                }}
              >
                {formatKidsMessageWithIcons(content)}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-[var(--kids-purple)] rounded-full animate-pulse ml-1 align-middle" />
              )}
            </div>
              {imageResults && imageResults.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 animate-pop-in">
                  {imageResults.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden border-2 border-[var(--kids-purple)]/20 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform shadow-sm"
                      onClick={() => setExpandedImage(img.imageUrl || img.thumbnailUrl)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.thumbnailUrl || img.imageUrl}
                        alt={img.title}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
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
    <div className="flex gap-2 items-center animate-fade-in">
      <span className="text-sm text-[var(--kids-purple)] font-bold animate-pulse">مدحت يفكر...</span>
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
