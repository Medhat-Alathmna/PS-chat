"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AnimatedBackground from "./AnimatedBackground";
import LottieAnimation from "../LottieAnimation";
import ProfileSwitcher from "./ProfileSwitcher";
import { RewardLevel } from "@/lib/types";
import { KidsProfile } from "@/lib/types/games";
import { getRandomPrompts, KidsPrompt } from "@/lib/data/kids-prompts";

const INTRO_VOICE_KEY = "falastin_intro_voice_played";

interface KidsIntroScreenProps {
  onSelect: (text: string) => void;
  points?: number;
  level?: RewardLevel;
  playerName?: string;
  isMusicPlaying?: boolean;
  isMusicLoaded?: boolean;
  onToggleMusic?: () => void;
  profiles?: KidsProfile[];
  activeProfile?: KidsProfile;
  onSwitchProfile?: (id: string) => void;
  onAddNewProfile?: () => void;
  onEditProfile?: () => void;
  onDeleteProfile?: (id: string) => void;
}

/**
 * Kids intro screen with fun suggestions
 */
export default function KidsIntroScreen({
  onSelect,
  points = 0,
  level,
  playerName,
  isMusicPlaying = false,
  isMusicLoaded = false,
  onToggleMusic,
  profiles = [],
  activeProfile,
  onSwitchProfile,
  onAddNewProfile,
  onEditProfile,
  onDeleteProfile,
}: KidsIntroScreenProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showLottie, setShowLottie] = useState(false);
  const [prompts, setPrompts] = useState<KidsPrompt[]>([]);

  // Play intro voice once per session
  useEffect(() => {
    if (sessionStorage.getItem(INTRO_VOICE_KEY)) return;

    const audio = new Audio("/sounds/medhat-voice/main tts.ogg");
    const markPlayed = () => sessionStorage.setItem(INTRO_VOICE_KEY, "1");
    const tryPlay = () => { audio.play().then(markPlayed).catch(() => {}); };

    const timer = setTimeout(() => {
      audio.play().then(markPlayed).catch(() => {
        // Autoplay blocked — wait for interaction inside this screen only
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("click", tryPlay, { once: true });
        el.addEventListener("touchstart", tryPlay, { once: true });
      });
    }, 600);

    return () => {
      clearTimeout(timer);
      const el = containerRef.current;
      if (el) {
        el.removeEventListener("click", tryPlay);
        el.removeEventListener("touchstart", tryPlay);
      }
    };
  }, []);

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

      <div ref={containerRef} className="min-h-screen flex flex-col">
        {/* Header row — music | profile + settings + level */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 z-20">
          {/* Left: music toggle */}
          {onToggleMusic ? (
            <button
              onClick={onToggleMusic}
              disabled={!isMusicLoaded}
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/80 backdrop-blur-sm rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              aria-label={isMusicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
              title={isMusicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
            >
              <span className="text-2xl sm:text-3xl">
                {isMusicPlaying ? "🎵" : "🔇"}
              </span>
            </button>
          ) : (
            <div />
          )}

          {/* Right: profile switcher + settings + level */}
          <div className="flex items-center gap-2">
            {profiles.length > 0 && activeProfile && onSwitchProfile && onAddNewProfile && onEditProfile && onDeleteProfile && (
              <div className="shrink-0">
                <ProfileSwitcher
                  profiles={profiles}
                  activeProfile={activeProfile}
                  onSwitch={onSwitchProfile}
                  onAddNew={onAddNewProfile}
                  onEdit={onEditProfile}
                  onDelete={onDeleteProfile}
                />
              </div>
            )}

            <button
              onClick={() => router.push("/settings")}
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/80 backdrop-blur-sm rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl"
              aria-label="الإعدادات"
              title="الإعدادات"
            >
              <span className="text-2xl sm:text-3xl">{"\u2699\uFE0F"}</span>
            </button>

            {level && points > 0 && (
              <>
                {/* Mobile: compact — icon + number only */}
                <div className="sm:hidden flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                  <span className="text-lg">{level.icon}</span>
                  <span className="font-bold text-sm text-[var(--kids-orange)]">{points}</span>
                </div>
                {/* Tablet+: full pill */}
                <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                  <span className="text-2xl">{level.icon}</span>
                  <span className="font-bold text-[var(--kids-orange)]">{points} ⭐</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
          <div className="text-center max-w-2xl w-full mx-auto">
            {/* Welcome text */}
            <div className="animate-fade-in-up">
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--kids-purple)] mb-2 sm:mb-5 bubble-text">
                {playerName ? `أهلاً يا ${playerName}! 🌟` : "أهلاً يا بطل! 🌟"}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-3 sm:mb-8">
                أنا مدحت، صاحبك من فلسطين!
                <br />
                <span className="text-[var(--kids-green)]">
                  يلا نلعب ونتعلم سوا! 🎮
                </span>
              </p>
            </div>

            {/* Suggestion cards — 2×2 grid on all sizes */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto w-full">
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

            {/* Games button */}
            <button
              onClick={() => router.push("/kids/games")}
              className="mt-6 sm:mt-8 w-full max-w-xl mx-auto flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white font-bold text-base sm:text-lg shadow-lg hover:scale-105 active:scale-95 transition-all animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <span className="text-xl sm:text-2xl">🎮</span>
              يلا نلعب ألعاب!
              <span className="text-xl sm:text-2xl">🎯</span>
            </button>

            {/* Or type your own */}
            <div className="mt-4 sm:mt-6 text-gray-500 text-sm animate-fade-in delay-500">
              <p>
                أو اكتب سؤالك الخاص! ✍️
              </p>
            </div>
          </div>

          {/* Fun decorations - Hidden on mobile */}
          <div className="hidden sm:block">
            <FloatingEmojis />
          </div>
        </div>
      </div>

      {/* علم فلسطين - سارية في الأسفل */}
      {showLottie && (
        <div
          className="hidden sm:flex fixed bottom-4 sm:bottom-6 left-4 sm:left-8 z-30 flex-col items-center animate-gentle-sway"
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
        relative w-full p-5 rounded-2xl text-right
        border-2 transition-all duration-300
        hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        animate-fade-in-up
      `}
      style={{
        animationDelay: `${delay}ms`,
        background: isHovered
          ? `linear-gradient(135deg, white 0%, ${prompt.color}22 100%)`
          : `linear-gradient(135deg, white 0%, ${prompt.color}12 100%)`,
        borderColor: isHovered ? prompt.color : `${prompt.color}60`,
        borderWidth: '2px',
      }}
    >
      {/* Emoji badge */}
      <span
        className={`
          absolute -top-3 -right-3 text-4xl
          ${isHovered ? "animate-bounce-kids" : ""}
        `}
      >
        {prompt.emoji}
      </span>

      {/* Text */}
      <p className="font-bold text-gray-700 pr-8">{prompt.textAr}</p>

      {/* Category indicator */}
      <span
        className="absolute bottom-2 left-2 text-sm font-semibold px-2.5 py-1 rounded-full"
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
    historical_figures: "شخصيات تاريخية",
    political_leaders: "قادة سياسيين",
  };
  return labels[category] || category;
}
