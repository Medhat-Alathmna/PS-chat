"use client";

import { useState, useMemo, useEffect } from "react";
import AnimatedMascot from "./AnimatedMascot";
import AnimatedBackground from "./AnimatedBackground";
import LottieAnimation from "../LottieAnimation";
import { RewardLevel } from "@/lib/types";
import { getRandomPrompts, KidsPrompt } from "@/lib/data/kids-prompts";

interface KidsIntroScreenProps {
  onSelect: (text: string) => void;
  points?: number;
  level?: RewardLevel;
}

/**
 * Kids intro screen with animated mascot and fun suggestions
 */
export default function KidsIntroScreen({
  onSelect,
  points = 0,
  level,
}: KidsIntroScreenProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showLottie, setShowLottie] = useState(false);
  const [prompts, setPrompts] = useState<KidsPrompt[]>([]);

  // Get 4 random prompts - only on client to avoid hydration mismatch
  useEffect(() => {
    setPrompts(getRandomPrompts(4));
  }, []);

  // Load Lottie animations after content
  useEffect(() => {
    setTimeout(() => setShowLottie(true), 800);
  }, []);

  return (
    <AnimatedBackground variant="sky" showClouds showBirds>
      {/* خريطة فلسطين - يمين الشاشة */}
      {showLottie && (
        <div
          className="hidden lg:block absolute right-8 xl:right-12 top-1/4 z-10 pointer-events-none animate-lottie-float"
          role="img"
          aria-label="خريطة فلسطين التفاعلية"
        >
          <LottieAnimation
            src="/lottie/Palestine.lottie"
            className="w-48 lg:w-56 xl:w-64 opacity-90"
            style={{
              filter: "drop-shadow(0 10px 30px rgba(0, 151, 54, 0.4))",
            }}
            speed={0.7}
          />
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Level indicator (if exists) */}
        {level && points > 0 && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
            <span className="text-2xl">{level.icon}</span>
            <span className="font-bold text-[var(--kids-orange)]">
              {points} ⭐
            </span>
          </div>
        )}

        {/* Main content */}
        <div className="text-center max-w-2xl mx-auto">
          {/* Mascot */}
          <div className="mb-6">
            <AnimatedMascot state="waving" size="xl" showName />
          </div>

          {/* Welcome text */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--kids-purple)] mb-3 bubble-text">
              أهلاً يا بطل! 🌟
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              أنا مدحت، صاحبك من فلسطين!
              <br />
              <span className="text-[var(--kids-green)]">
                يلا نلعب ونتعلم سوا! 🎮
              </span>
            </p>
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
            {prompts.map((prompt, index) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                delay={index * 100}
                isHovered={hoveredCard === prompt.id}
                onHover={() => setHoveredCard(prompt.id)}
                onLeave={() => setHoveredCard(null)}
                onClick={() => onSelect(prompt.textAr)}
              />
            ))}
          </div>

          {/* Or type your own */}
          <div className="mt-6 text-gray-500 text-sm animate-fade-in delay-500">
            <p>
              أو اكتب سؤالك الخاص! ✍️
            </p>
          </div>
        </div>

        {/* Fun decorations */}
        <FloatingEmojis />
      </div>

      {/* علم فلسطين - سارية في الأسفل */}
      {showLottie && (
        <div
          className="fixed bottom-4 sm:bottom-6 left-4 sm:left-8 z-30 flex flex-col items-center animate-gentle-sway"
          role="img"
          aria-label="علم فلسطين - رمز الحرية والكرامة"
        >
          {/* العلم */}
          <LottieAnimation
            src="/lottie/Palestine flag Lottie JSON animation.lottie"
            className="h-36 sm:h-44 md:h-56 lg:h-64 w-auto"
            style={{
              transformOrigin: "bottom center",
              filter: "drop-shadow(0 8px 20px rgba(238, 42, 53, 0.3))",
            }}
            speed={0.5}
          />

          {/* قاعدة السارية */}
          <div className="relative w-16 sm:w-20 h-1.5 sm:h-2 mt-0.5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/50 to-transparent blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/80 to-transparent rounded-full" />
          </div>
        </div>
      )}
    </AnimatedBackground>
  );
}

/**
 * Individual prompt card
 */
function PromptCard({
  prompt,
  delay,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: {
  prompt: KidsPrompt;
  delay: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative p-4 rounded-2xl text-right
        bg-white/90 backdrop-blur-sm
        border-3 transition-all duration-300
        hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        animate-fade-in-up
      `}
      style={{
        animationDelay: `${delay}ms`,
        borderColor: isHovered ? prompt.color : "transparent",
        backgroundColor: isHovered ? `${prompt.color}15` : undefined,
      }}
    >
      {/* Emoji badge */}
      <span
        className={`
          absolute -top-3 -right-3 text-3xl
          ${isHovered ? "animate-bounce-kids" : ""}
        `}
      >
        {prompt.emoji}
      </span>

      {/* Text */}
      <p className="font-bold text-gray-700 pr-6">{prompt.textAr}</p>

      {/* Category indicator */}
      <span
        className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${prompt.color}30`, color: prompt.color }}
      >
        {getCategoryLabel(prompt.category)}
      </span>
    </button>
  );
}

/**
 * Floating emojis decoration
 */
function FloatingEmojis() {
  const emojis = useMemo(
    () => [
      { emoji: "🇵🇸", position: "top-20 left-10", delay: "0s" },
      { emoji: "🫒", position: "top-32 right-16", delay: "0.5s" },
      { emoji: "🕌", position: "bottom-32 left-8", delay: "1s" },
      { emoji: "🌟", position: "top-48 left-1/4", delay: "1.5s" },
      { emoji: "🧆", position: "bottom-40 right-12", delay: "2s" },
    ],
    []
  );

  return (
    <>
      {emojis.map((item, index) => (
        <span
          key={index}
          className={`
            absolute ${item.position} text-3xl
            animate-float opacity-60
            pointer-events-none
          `}
          style={{ animationDelay: item.delay }}
        >
          {item.emoji}
        </span>
      ))}
    </>
  );
}

/**
 * Get Arabic category label
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    cities: "مدن",
    food: "طعام",
    history: "تاريخ",
    culture: "ثقافة",
    fun: "مرح",
  };
  return labels[category] || category;
}
