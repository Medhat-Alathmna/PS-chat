"use client";

import { useState, useMemo } from "react";
import AnimatedMascot from "./AnimatedMascot";
import AnimatedBackground from "./AnimatedBackground";
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

  // Get 4 random prompts
  const prompts = useMemo(() => getRandomPrompts(4), []);

  return (
    <AnimatedBackground variant="sky" showClouds showBirds>
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
