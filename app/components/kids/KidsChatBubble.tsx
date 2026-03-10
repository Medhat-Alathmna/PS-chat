"use client";

import { useState, useMemo } from "react";
import { ChatMessage } from "@/lib/types";
import SpeakingIndicator from "./SpeakingIndicator";

interface KidsChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
  textStyle?: { fontFamily: string; fontSize: string };
  className?: string;
}

const ASSISTANT_COLORS = ["#6C5CE7", "#0984E3", "#00B894", "#E17055", "#FDCB6E"];

export default function KidsChatBubble({
  message,
  isStreaming = false,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
  textStyle,
  className,
}: KidsChatBubbleProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const isUser = message.role === "user";

  const bgColor = useMemo(() => {
    if (isUser) return null;
    const index =
      message.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      ASSISTANT_COLORS.length;
    return ASSISTANT_COLORS[index];
  }, [message.id, isUser]);

  // ── User message ──────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[80%] bg-gradient-to-br from-[var(--kids-green)] to-[#3DBDB2] text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md">
          {message.userImages && message.userImages.length > 0 && (
            <div className="mb-2 grid grid-cols-2 gap-2">
              {message.userImages.map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border-2 border-white/40 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform"
                  onClick={() => setExpandedImage(img.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="صورة من المستخدم" className="w-full aspect-[4/3] object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
          <p className="leading-relaxed whitespace-pre-wrap" dir="auto" style={textStyle}>
            {message.content}
          </p>
        </div>

        {expandedImage && <Lightbox src={expandedImage} onClose={() => setExpandedImage(null)} />}
      </div>
    );
  }

  // ── Assistant message — matches GameChatBubble structure ──────
  return (
    <div className={`flex gap-2 items-start ${className ?? "animate-fade-in-up"}`}>

      <div className="max-w-[85%] flex flex-col gap-2">
        {/* Bubble */}
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-md"
          style={{ backgroundColor: `${bgColor}15`, border: `2px solid ${bgColor}30` }}
        >
          <p className="leading-relaxed text-gray-700 whitespace-pre-wrap" dir="auto" style={textStyle}>
            {formatKidsMessageWithIcons(message.content)}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[var(--kids-purple)] rounded-full animate-pulse ml-1 align-middle" />
            )}
          </p>

          {/* Images — below text, full bubble width */}
          {message.images && message.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 animate-pop-in">
              {message.images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border-2 border-[var(--kids-purple)]/20 cursor-pointer hover:scale-[1.03] active:scale-95 transition-transform shadow-sm"
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
            <div className="mt-3 rounded-2xl overflow-hidden border-2 border-[var(--kids-purple)]/30 shadow-lg">
              <iframe
                src={message.video.embedUrl}
                title={message.video.title}
                className="w-full aspect-video bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
              <div className="px-3 py-2.5 bg-white/90 backdrop-blur-sm">
                <p className="text-xs font-bold text-gray-700 line-clamp-1">🎬 {message.video.title}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  {message.video.channelName && (
                    <p className="text-[10px] text-gray-500">{message.video.channelName}</p>
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
        </div>

        {/* Action buttons — below bubble, same as GameChatBubble */}
        {!isStreaming && (
          <div className="flex gap-1.5">
            {onSpeak && (
              <SpeakingIndicator
                isSpeaking={isSpeaking}
                onToggle={isSpeaking ? () => onStopSpeaking?.() : () => onSpeak()}
              />
            )}
          </div>
        )}
      </div>

      {expandedImage && <Lightbox src={expandedImage} onClose={() => setExpandedImage(null)} />}
    </div>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl transition-colors"
        onClick={onClose}
        aria-label="إغلاق"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="صورة مكبّرة"
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function formatKidsMessageWithIcons(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi, '');
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  cleaned = cleaned.replace(/\n\n+/g, '\n\n');
  cleaned = cleaned.trim();
  if (!cleaned.match(/[🎉🎊⭐✨🏆👋🌟💫]/)) {
    if (cleaned.includes("مبروك") && !cleaned.includes("🎉")) {
      cleaned = cleaned.replace(/مبروك/g, "مبروك 🎉");
    }
    if (cleaned.includes("فلسطين") && !cleaned.includes("🇵🇸")) {
      cleaned = cleaned.replace(/فلسطين/g, "فلسطين 🇵🇸");
    }
  }
  return cleaned;
}

export function TypingBubble() {
  return (
    <div className="flex gap-2 items-center animate-fade-in-up">
      <span className="text-sm text-[var(--kids-purple)] font-bold animate-pulse">مدحت يفكر...</span>
      <div className="px-4 py-3 bg-white/80 rounded-2xl rounded-tl-sm shadow-md">
        <div className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 bg-[var(--kids-blue)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 bg-[var(--kids-green)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export function QuickReactions({ onReact, className = "" }: { onReact: (emoji: string) => void; className?: string }) {
  const reactions = ["❤️", "😂", "🎉", "⭐", "🇵🇸"];
  return (
    <div className={`flex gap-2 ${className}`}>
      {reactions.map((emoji) => (
        <button key={emoji} onClick={() => onReact(emoji)} className="text-2xl hover:scale-125 active:scale-95 transition-transform">
          {emoji}
        </button>
      ))}
    </div>
  );
}
