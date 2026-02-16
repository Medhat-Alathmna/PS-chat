"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameCategory } from "@/lib/types/games";
import { getGamesByCategory } from "@/lib/data/games";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import AnimatedMascot from "../../components/kids/AnimatedMascot";
import GameCard from "../../components/kids/games/GameCard";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ErrorBoundary from "../../components/ErrorBoundary";
import RewardsBar from "../../components/kids/RewardsBar";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { useSounds } from "@/lib/hooks/useSounds";
import ExpandableMap from "../../components/kids/ExpandableMap";
import { useMapSettings } from "@/lib/hooks/useMapSettings";

const CATEGORIES: { id: GameCategory; label: string; emoji: string; color: string }[] = [
  { id: "educational", label: "تعليمي", emoji: "📚", color: "#6C5CE7" },
  { id: "classic", label: "كلاسيكي", emoji: "🎯", color: "#0984E3" },
  { id: "creative", label: "إبداعي", emoji: "🎨", color: "#00B894" },
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
  const { soundEnabled, toggleSound, playClick } = useSounds();

  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;
  const { points, level, unlockedStickers, progressToNextLevel } = useRewards(profileId);
  const { totalCount } = useStickers(unlockedStickers, () => { });
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
      <div className="relative flex h-screen flex-col overflow-hidden">
        {/* Header - Responsive centered */}
        <header className="shrink-0 px-2 py-2 sm:px-4 sm:py-3 z-10 w-full">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
              <RewardsBar
                points={points}
                level={level}
                progress={progressToNextLevel()}
                unlockedStickersCount={unlockedStickers.length}
                totalStickersCount={totalCount}
                pointsEarned={0}
                onOpenStickers={() => { }}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4 scroll-smooth">
          <div className="mx-auto max-w-2xl pb-20">
            {/* Title */}
            <div className="text-center mb-4 pt-2">
              <AnimatedMascot state="happy" size="lg" className="mb-2" />
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
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 px-1 -mx-3 sm:mx-0 sm:justify-center sm:overflow-visible no-scrollbar scroll-pl-3 snap-x">
              {/* Spacer for scroll start */}
              <div className="w-1 sm:hidden shrink-0 snap-start" />

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
                  <span className="mr-2 text-lg">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}

              {/* Spacer for scroll end */}
              <div className="w-1 sm:hidden shrink-0 snap-end" />
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {games.map((game, index) => (
                <div
                  key={game.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
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
              onClick={() => router.push("/kids")}
              className="w-full py-3.5 bg-white/90 backdrop-blur-md text-[var(--kids-purple)] border-2 border-[var(--kids-purple)]/20 rounded-2xl font-black text-base shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-95 transition-all hover:bg-[var(--kids-purple)] hover:text-white"
            >
              ← رجوع للدردشة
            </button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
