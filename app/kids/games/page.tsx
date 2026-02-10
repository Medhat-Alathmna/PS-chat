"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameCategory } from "@/lib/types/games";
import { getGamesByCategory } from "@/lib/data/games";
import AnimatedBackground from "../../components/kids/AnimatedBackground";
import AnimatedMascot from "../../components/kids/AnimatedMascot";
import GameCard from "../../components/kids/games/GameCard";
import ProfileSetup from "../../components/kids/ProfileSetup";
import ProfileSwitcher from "../../components/kids/ProfileSwitcher";
import ErrorBoundary from "../../components/ErrorBoundary";
import RewardsBar from "../../components/kids/RewardsBar";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import { useStickers } from "@/lib/hooks/useStickers";
import { useSounds } from "@/lib/hooks/useSounds";

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
  const { totalCount } = useStickers(unlockedStickers, () => {});

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
        {/* Header */}
        <header className="shrink-0 px-4 py-3">
          <div className="flex items-center gap-2">
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              onSwitch={switchProfile}
              onAddNew={() => setShowProfileSetup(true)}
              onEdit={() => setShowProfileSetup(true)}
              onDelete={deleteProfile}
            />
            <div className="flex-1">
              <RewardsBar
                points={points}
                level={level}
                progress={progressToNextLevel()}
                unlockedStickersCount={unlockedStickers.length}
                totalStickersCount={totalCount}
                pointsEarned={0}
                onOpenStickers={() => {}}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl">
            {/* Title */}
            <div className="text-center mb-6">
              <AnimatedMascot state="happy" size="lg" />
              <h1 className="text-2xl font-bold text-[var(--kids-purple)] mt-2 bubble-text">
                يلا نلعب! 🎮
              </h1>
              <p className="text-gray-500 text-sm">اختار لعبة ممتعة!</p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 justify-center mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    playClick();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === cat.id
                      ? "text-white shadow-md scale-105"
                      : "bg-white/70 text-gray-600 hover:bg-white"
                  }`}
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Games grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

        {/* Back button */}
        <div className="shrink-0 px-4 py-4 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => router.push("/kids")}
              className="w-full py-3 bg-[var(--kids-purple)] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-transform shadow-md"
            >
              ← رجوع للدردشة
            </button>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
