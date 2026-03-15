"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameCategory } from "@/lib/types/games";
import { getGamesByCategory } from "@/lib/data/games";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import GameCard from "../../components/kids/games/GameCard";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ErrorBoundary from "../../components/ErrorBoundary";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useSounds } from "@/lib/hooks/useSounds";
import ExpandableMap from "../../components/kids/ExpandableMap";
import { useMapSettings } from "@/lib/hooks/useMapSettings";

const CATEGORIES: { id: GameCategory; label: string;  color: string }[] = [
  { id: "educational", label: "تعليمي",  color: "#6C5CE7" },
  { id: "creative", label: "إبداعي", color: "#00B894" },
];

export default function GamesHubPage() {
  return (
    <ErrorBoundary>
      <GamesHub />
    </ErrorBoundary>
  );
}

function GamesHub() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<GameCategory>("educational");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const {  playClick } = useSounds();

  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,

  } = useProfiles();

  const profileId = activeProfile?.id;

  const { settings: mapSettings } = useMapSettings(profileId);

  if (!isLoaded) return null;

  if (profiles.length === 0 || showProfileSetup) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          createProfile(data);
          setShowProfileSetup(false);
        }}
        existingProfiles={profiles}
        onCancel={profiles.length > 0 ? () => setShowProfileSetup(false) : undefined}
      />
    );
  }

  if (activeProfile && !activeProfile.name) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          updateProfile(activeProfile.id, data);
        }}
        existingProfiles={profiles}
      />
    );
  }

  if (!activeProfile) return null;

  const games = getGamesByCategory(activeCategory);

  return (
    <AnimatedBackground variant="sky" showClouds>
      <div className="relative flex h-dvh flex-col overflow-hidden">
    

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 scroll-smooth">
          <div className="mx-auto max-w-2xl pb-20">
            {/* Title */}
            <div className="text-center mb-4 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--kids-purple)] tracking-wide drop-shadow-sm bubble-text">
                يلا نلعب! 🎮
              </h1>
              <p className="text-gray-600 text-sm sm:text-base font-medium mt-1">اختار لعبة ممتعة!</p>
            </div>

            {/* Palestine Map - Mobile only (collapsible) */}
            <div className="mb-4 md:hidden">
              <ExpandableMap
                size="sm"
                collapsible
                initialCollapsed
                title="🗺️ خريطة فلسطين"
                subtitle="اكتشف المدن"
                mapSettings={mapSettings}
              />
            </div>

            {/* Category tabs - Horizontally Scrollable on Mobile */}
            <div style={{justifyContent:'center'}} className="flex gap-2 mb-6 overflow-x-auto pb-2 px-1 -mx-3 sm:mx-0 sm:overflow-visible no-scrollbar scroll-pl-3 snap-x">
              {/* Spacer for scroll start */}
              <div className="w-1 sm:hidden shrink-0 snap-start " />

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    playClick();
                  }}
                  className={`snap-start shrink-0 px-4 py-2.5 rounded-2xl text-sm sm:text-base font-bold transition-all border-2 ${activeCategory === cat.id
                      ? "text-white shadow-lg scale-105 border-transparent"
                      : "bg-white/60 text-gray-600 border-transparent hover:bg-white hover:border-white/50"
                    }`}
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: cat.color, boxShadow: `0 4px 12px ${cat.color}66` }
                      : undefined
                  }
                >
                  {cat.label}
                </button>
              ))}

              {/* Spacer for scroll end */}
              <div className="w-1 sm:hidden shrink-0 snap-end" />
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Special World Explorer card — visible in educational category */}
              {activeCategory === "educational" && (
                <div className="animate-fade-in-up">
                  <button
                    onClick={() => {
                      playClick();
                      router.push("/kids/world-explorer");
                    }}
                    className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-right backdrop-blur-sm border-2 sm:border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl group w-full flex flex-col items-center sm:items-stretch h-full"
                    style={{
                      borderColor: "#54A0FF40",
                      background: "linear-gradient(135deg, #000814, #0c1a3a, #0d2137)",
                    }}
                  >
                    <span
                      className="absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#54A0FF20", color: "#54A0FF" }}
                    >
                      جديد ✨
                    </span>
                    <span className="text-4xl sm:text-5xl block mb-1 sm:mb-2 mt-4 sm:mt-2 group-hover:animate-bounce-kids filter drop-shadow-sm">
                      🌍
                    </span>
                    <h3 className="font-bold text-white text-sm sm:text-lg mb-0.5 sm:mb-1 text-center sm:text-right w-full truncate">
                      مستكشف الدول
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/60 line-clamp-2 text-center sm:text-right hidden xs:block">
                      استكشف دول العالم بكرة ثلاثية الأبعاد
                    </p>
                    <div
                      className="absolute bottom-0 left-4 right-4 h-1 rounded-full opacity-60"
                      style={{ backgroundColor: "#54A0FF" }}
                    />
                  </button>
                </div>
              )}
              {/* Special Stories card — visible in creative category */}
              {activeCategory === "creative" && (
                <div className="animate-fade-in-up">
                  <button
                    onClick={() => {
                      playClick();
                      router.push("/kids/games/stories");
                    }}
                    className="relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-right backdrop-blur-sm border-2 sm:border-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl group w-full flex flex-col items-center sm:items-stretch h-full"
                    style={{
                      borderColor: "#6366f140",
                      background: "linear-gradient(135deg, #4338ca, #6d28d9, #1e1b4b)",
                    }}
                  >
                    <span
                      className="absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#00B89420", color: "#00B894" }}
                    >
                      إبداعي
                    </span>
                    <span className="text-4xl sm:text-5xl block mb-1 sm:mb-2 mt-4 sm:mt-2 group-hover:animate-bounce-kids filter drop-shadow-sm">
                      📖🌙
                    </span>
                    <h3 className="font-bold text-white text-sm sm:text-lg mb-0.5 sm:mb-1 text-center sm:text-right w-full truncate">
                      احكيلي قصة!
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/60 line-clamp-2 text-center sm:text-right hidden xs:block">
                      قصص تفاعلية قبل النوم
                    </p>
                    <div
                      className="absolute bottom-0 left-4 right-4 h-1 rounded-full opacity-60"
                      style={{ backgroundColor: "#818cf8" }}
                    />
                  </button>
                </div>
              )}
              {games.map((game, index) => (
                <div
                  key={game.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${(index + (activeCategory === "creative" ? 1 : 0)) * 50}ms` }}
                >
                  <GameCard
                    game={game}
                    onClick={() => {
                      playClick();
                      router.push(`/kids/games/${game.id}`);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Desktop map panel — absolutely positioned on the right, same as game session */}
        <div className="hidden md:block absolute top-[60px] right-3 w-[25%] min-w-[200px] max-w-[350px] h-[70%] z-10" style={{ marginBlockStart: '5rem' }}>
          <ExpandableMap
            size="lg"
            collapsible
            initialCollapsed={false}
            title="🗺️ خريطة فلسطين"
            subtitle="اكتشف المدن"
            className="h-full flex flex-col"
            collapsedHeight="h-full"
            mapSettings={mapSettings}
          />
        </div>

        {/* Floating Back button */}
        <div className="absolute bottom-4 left-0 right-0 z-20 px-4 pointer-events-none">
          <div className="mx-auto max-w-sm pointer-events-auto">
            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 bg-[var(--kids-purple)] text-white border-2 border-[var(--kids-purple)] rounded-2xl font-black text-base shadow-[0_8px_20px_rgba(108,92,231,0.3)] hover:scale-[1.02] active:scale-95 transition-all hover:bg-[var(--kids-purple)]/90 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              رجوع للرئيسية
            </button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
