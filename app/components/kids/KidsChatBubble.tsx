"use client";

import { useState, useMemo } from "react";
import { ChatMessage } from "@/lib/types";
import { MiniMascot } from "./AnimatedMascot";
import SpeakingIndicator from "./SpeakingIndicator";

interface KidsChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onLike?: () => void;
  liked?: boolean;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  textStyle?: { fontFamily: string; fontSize: string };
}

// Dynamic hex colors for assistant bubbles (matching GameChatBubble)
const ASSISTANT_COLORS = ["#6C5CE7", "#0984E3", "#00B894", "#E17055", "#FDCB6E"];

/**
 * Chat bubble designed for kids
 * Colorful, rounded, with emoji reactions
 */
export default function KidsChatBubble({
  message,
  isStreaming = false,
  onLike,
  liked = false,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
  textStyle,
}: KidsChatBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const isUser = message.role === "user";

  // Random color for assistant bubbles (consistent per message)
  const bgColor = useMemo(() => {
    if (isUser) return null;
    const index =
      message.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      ASSISTANT_COLORS.length;
    return ASSISTANT_COLORS[index];
  }, [message.id, isUser]);

  // Determine mascot state based on message content
  const mascotState = useMemo(() => {
    if (isStreaming) return "thinking";
    if (!message.content) return "happy";

    const content = message.content.toLowerCase();

    // Celebrating/Happy
    if (content.includes("مبروك") || content.includes("برافو") || content.includes("ممتاز") ||
        content.includes("رائع") || content.includes("يا سلام") || content.includes("🎉") ||
        content.includes("⭐") || content.includes("🏆")) {
      return "celebrating";
    }

    // Waving/Greeting
    if (content.includes("أهلا") || content.includes("مرحبا") || content.includes("السلام عليكم") ||
        content.includes("صباح") || content.includes("مساء") || content.includes("👋")) {
      return "waving";
    }

    // Questions/Thinking
    if (content.includes("؟") || content.includes("هل") || content.includes("ماذا") ||
        content.includes("كيف") || content.includes("لماذا") || content.includes("متى")) {
      return "thinking";
    }

    // Default happy
    return "happy";
  }, [message.content, isStreaming]);

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
          <MiniMascot state={mascotState} size="sm" />
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
          px-4 py-3 sm:px-5 sm:py-4
          transition-all duration-300 shadow-lg
          ${isUser
            ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-[var(--kids-green)] to-[#3DBDB2] text-white shadow-[var(--kids-green)]/30"
            : "rounded-2xl rounded-tl-sm"
          }
        `}
        style={!isUser && bgColor ? { backgroundColor: `${bgColor}15`, border: `2px solid ${bgColor}30` } : undefined}
      >
        {/* User-uploaded images */}
        {isUser && message.userImages && message.userImages.length > 0 && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            {message.userImages.map((img, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden border-2 border-white/40 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
                onClick={() => setExpandedImage(img.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="صورة من المستخدم"
                  className="w-full aspect-[4/3] object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <div
          className={`leading-relaxed whitespace-pre-wrap ${isUser ? "" : "text-gray-800"}`}
          dir="auto"
          style={textStyle}
        >
          {formatKidsMessageWithIcons(message.content)}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[var(--kids-purple)] rounded-full animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Images — below text, full bubble width */}
        {message.images && message.images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 animate-pop-in">
            {message.images.slice(0, 4).map((img, i) => (
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

        {/* Video */}
        {message.video && (
          <div className="mt-3 rounded-2xl overflow-hidden border-3 border-[var(--kids-purple)]/30 bg-gradient-to-br from-[var(--kids-purple)]/5 to-[var(--kids-blue)]/5 shadow-lg">
            <iframe
              src={message.video.embedUrl}
              title={message.video.title}
              className="w-full aspect-video bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
            <div className="px-3 py-2.5 bg-white/90 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-700 line-clamp-1">
                🎬 {message.video.title}
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                {message.video.channelName && (
                  <p className="text-[10px] text-gray-500">
                    {message.video.channelName}
                  </p>
                )}
                <a
                  href={`https://www.youtube.com/watch?v=${message.video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[var(--kids-red)] hover:underline whitespace-nowrap"
                >
                  شاهد على YouTube ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons for assistant messages */}
        {!isUser && !isStreaming && (
          <div className="absolute -bottom-3 right-4 flex gap-1.5">
            {/* Speaking indicator */}
            {onSpeak && (
              <SpeakingIndicator
                isSpeaking={isSpeaking}
                onToggle={isSpeaking ? () => onStopSpeaking?.() : () => onSpeak()}
              />
            )}

            {/* Like button */}
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

/**
 * Format message for kids - add emojis and make it friendly
 * Also clean up URLs and links and add contextual icons
 */
function formatKidsMessageWithIcons(content: string): string {
  let cleaned = content;

  // Remove image URLs (Wikimedia, Wikipedia, etc.)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, '');

  // Remove other URLs (keep them out of kids' view)
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // Remove multiple empty lines
  cleaned = cleaned.replace(/\n\n+/g, '\n\n');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Add contextual icons (only if not already present)
  if (!cleaned.match(/[🎉🎊⭐✨🏆👋🌟💫]/)) {
    // Check for certain keywords and add appropriate emoji
    if (cleaned.includes("مبروك") && !cleaned.includes("🎉")) {
      cleaned = cleaned.replace(/مبروك/g, "مبروك 🎉");
    }
    if (cleaned.includes("فلسطين") && !cleaned.includes("🇵🇸")) {
      cleaned = cleaned.replace(/فلسطين/g, "فلسطين 🇵🇸");
    }
  }

  return cleaned;
}

/**
 * Typing indicator bubble with enhanced animation
 */
export function TypingBubble() {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="flex-shrink-0">
        <MiniMascot state="thinking" size="sm" />
      </div>
      <div className="bg-gradient-to-br from-[var(--kids-blue)]/15 to-[var(--kids-purple)]/10 border-3 border-[var(--kids-blue)] rounded-3xl px-6 py-4 shadow-lg animate-pulse-subtle">
        <div className="flex gap-1.5 items-center">
          <span
            className="w-3 h-3 bg-[var(--kids-blue)] rounded-full animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="w-3 h-3 bg-[var(--kids-purple)] rounded-full animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1s" }}
          />
          <span
            className="w-3 h-3 bg-[var(--kids-green)] rounded-full animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1s" }}
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
