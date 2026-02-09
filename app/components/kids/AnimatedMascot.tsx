"use client";

import { useEffect, useState, useMemo } from "react";
import { MascotState } from "@/lib/types";

interface AnimatedMascotProps {
  state?: MascotState;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const STATE_ANIMATIONS: Record<MascotState, string> = {
  idle: "animate-float",
  thinking: "animate-pulse-grow",
  happy: "animate-bounce-kids",
  waving: "animate-wiggle",
  celebrating: "animate-bounce-kids",
  speaking: "animate-speaking",
};

/**
 * Animated mascot component - Medhat (مدحت)
 * A Palestinian boy character with keffiyeh
 *
 * Currently uses CSS animations + emoji placeholder
 * Can be upgraded to Lottie animations later
 */
export default function AnimatedMascot({
  state = "idle",
  size = "lg",
  showName = false,
  className = "",
}: AnimatedMascotProps) {
  const [currentEmoji, setCurrentEmoji] = useState("👦🏻");
  const [speechBubble, setSpeechBubble] = useState("");

  // Emoji face based on state
  const stateEmojis: Record<MascotState, string> = useMemo(
    () => ({
      idle: "👦🏻",
      thinking: "🤔",
      happy: "😄",
      waving: "👋",
      celebrating: "🎉",
      speaking: "🗣️",
    }),
    []
  );

  // Speech bubbles for each state
  const speechBubbles: Record<MascotState, string[]> = useMemo(
    () => ({
      idle: ["", ""],
      thinking: ["🤔", "هممم..."],
      happy: ["يا سلام! 🌟", "ممتاز! ⭐"],
      waving: ["أهلاً! 👋", "مرحبا! 🎈"],
      celebrating: ["مبروك! 🎊", "برافو! 🏆"],
      speaking: ["بتكلم... 🔊", "اسمع... 🎧"],
    }),
    []
  );

  useEffect(() => {
    setCurrentEmoji(stateEmojis[state]);

    // Show random speech bubble for active states
    if (state !== "idle") {
      const bubbles = speechBubbles[state];
      const randomBubble = bubbles[Math.floor(Math.random() * bubbles.length)];
      setSpeechBubble(randomBubble);

      // Clear bubble after a while
      const timer = setTimeout(() => setSpeechBubble(""), 3000);
      return () => clearTimeout(timer);
    } else {
      setSpeechBubble("");
    }
  }, [state, stateEmojis, speechBubbles]);

  const animationClass = STATE_ANIMATIONS[state];

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-lg animate-pop-in z-10">
          <span className="text-lg font-bold">{speechBubble}</span>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
        </div>
      )}

      {/* Character Container */}
      <div
        className={`
          ${SIZE_CLASSES[size]}
          ${animationClass}
          relative flex items-center justify-center
          bg-gradient-to-br from-[var(--kids-yellow)] to-[var(--kids-orange)]
          rounded-full shadow-xl
          border-4 border-white
        `}
      >
        {/* Keffiyeh Pattern (top) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[120%] h-[40%]"
          style={{
            background: "repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)",
            borderRadius: "50% 50% 0 0",
            opacity: 0.8,
          }}
        />

        {/* Face emoji */}
        <span
          className="text-4xl sm:text-5xl lg:text-6xl select-none"
          style={{ fontSize: size === "xl" ? "4rem" : undefined }}
        >
          {currentEmoji}
        </span>

        {/* Celebration effects */}
        {state === "celebrating" && (
          <>
            <span className="absolute -top-2 -right-2 animate-sparkle text-2xl">
              ✨
            </span>
            <span className="absolute -top-2 -left-2 animate-sparkle delay-200 text-2xl">
              ⭐
            </span>
            <span className="absolute -bottom-2 right-0 animate-sparkle delay-300 text-2xl">
              🌟
            </span>
          </>
        )}

        {/* Waving hand for waving state */}
        {state === "waving" && (
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-3xl animate-wiggle">
            👋
          </span>
        )}
      </div>

      {/* Name label */}
      {showName && (
        <div className="mt-3 text-center">
          <p className="text-xl font-bold text-[var(--kids-purple)] bubble-text">
            مدحت
          </p>
          <p className="text-sm text-gray-500">صاحبك من فلسطين</p>
        </div>
      )}
    </div>
  );
}

/**
 * Mini mascot for inline use
 */
export function MiniMascot({
  state = "idle",
  className = "",
}: {
  state?: MascotState;
  className?: string;
}) {
  return (
    <AnimatedMascot state={state} size="sm" showName={false} className={className} />
  );
}

/**
 * Thinking indicator with mascot
 */
export function ThinkingMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AnimatedMascot state="thinking" size="sm" />
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-[var(--kids-purple)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
