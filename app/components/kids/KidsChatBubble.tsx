"use client";

import { useState, useMemo } from "react";
import { ChatMessage } from "@/lib/types";
import { MiniMascot, ThinkingMascot } from "./AnimatedMascot";

interface KidsChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onLike?: () => void;
  liked?: boolean;
}

// Fun colors for assistant bubbles
const BUBBLE_COLORS = [
  { bg: "bg-[var(--kids-blue)]/10", border: "border-[var(--kids-blue)]" },
  { bg: "bg-[var(--kids-green)]/10", border: "border-[var(--kids-green)]" },
  { bg: "bg-[var(--kids-purple)]/10", border: "border-[var(--kids-purple)]" },
  { bg: "bg-[var(--kids-orange)]/10", border: "border-[var(--kids-orange)]" },
];

/**
 * Chat bubble designed for kids
 * Colorful, rounded, with emoji reactions
 */
export default function KidsChatBubble({
  message,
  isStreaming = false,
  onLike,
  liked = false,
}: KidsChatBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const isUser = message.role === "user";

  // Random color for assistant bubbles (consistent per message)
  const bubbleColor = useMemo(() => {
    if (isUser) return null;
    const index =
      message.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      BUBBLE_COLORS.length;
    return BUBBLE_COLORS[index];
  }, [message.id, isUser]);

  // Show thinking indicator for empty streaming
  if (isStreaming && !message.content) {
    return (
      <div className="flex justify-start">
        <ThinkingMascot className="animate-fade-in" />
      </div>
    );
  }

  return (
    <div
      className={`
        flex gap-3 animate-fade-in-up
        ${isUser ? "flex-row-reverse" : "flex-row"}
      `}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <MiniMascot state={isStreaming ? "thinking" : "happy"} />
        </div>
      )}

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--kids-green)] flex items-center justify-center text-xl">
          😊
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          relative max-w-[80%] sm:max-w-[70%]
          rounded-3xl px-5 py-4
          transition-all duration-300
          ${
            isUser
              ? "bg-gradient-to-br from-[var(--kids-green)] to-[#3DBDB2] text-white shadow-lg shadow-[var(--kids-green)]/30"
              : `${bubbleColor?.bg} ${bubbleColor?.border} border-3 shadow-lg`
          }
        `}
      >
        {/* Message content */}
        <div
          className={`
            text-base leading-relaxed whitespace-pre-wrap
            ${isUser ? "" : "text-gray-700"}
          `}
          dir="auto"
        >
          {formatKidsMessage(message.content)}
        </div>

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {message.images.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer border-3 border-[var(--kids-yellow)]/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbnailUrl || img.imageUrl}
                  alt={img.title}
                  className="w-full h-36 object-cover"
                  loading="lazy"
                />
                {/* Optional: Image title badge */}
                {img.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center backdrop-blur-sm">
                    {img.title.slice(0, 30)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Video */}
        {message.video && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <iframe
              src={message.video.embedUrl}
              title={message.video.title}
              className="w-full aspect-video"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        {/* Like button for assistant messages */}
        {!isUser && !isStreaming && (
          <div className="absolute -bottom-3 right-4">
            <button
              onClick={() => {
                setShowReactions(!showReactions);
                if (!liked) onLike?.();
              }}
              className={`
                w-8 h-8 rounded-full
                bg-white shadow-md
                flex items-center justify-center
                text-lg
                hover:scale-110 active:scale-95
                transition-transform
                ${liked ? "animate-heart-beat" : ""}
              `}
            >
              {liked ? "❤️" : "🤍"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format message for kids - add emojis and make it friendly
 * Also clean up URLs and links
 */
function formatKidsMessage(content: string): string {
  let cleaned = content;

  // Remove image URLs (Wikimedia, Wikipedia, etc.)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, '');

  // Remove other URLs (keep them out of kids' view)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // Remove multiple empty lines
  cleaned = cleaned.replace(/\n\n+/g, '\n\n');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Typing indicator bubble
 */
export function TypingBubble() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <MiniMascot state="thinking" />
      <div className="bg-[var(--kids-blue)]/10 border-2 border-[var(--kids-blue)] rounded-3xl px-5 py-4">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-[var(--kids-blue)] rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-[var(--kids-blue)] rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-[var(--kids-blue)] rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Quick reactions for kids
 */
export function QuickReactions({
  onReact,
  className = "",
}: {
  onReact: (emoji: string) => void;
  className?: string;
}) {
  const reactions = ["❤️", "😂", "🎉", "⭐", "🇵🇸"];

  return (
    <div className={`flex gap-2 ${className}`}>
      {reactions.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="
            text-2xl hover:scale-125 active:scale-95
            transition-transform
          "
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
