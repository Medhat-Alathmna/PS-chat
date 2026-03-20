"use client";

import { RewardLevel } from "@/lib/types";
import SettingsMenu from "./SettingsMenu";
import RewardsBar from "./RewardsBar";
import type { KidsProfile } from "@/lib/types/games";

/**
 * Props for the ChatHeader component
 */
interface ChatHeaderProps {
  // Profile
  profiles: KidsProfile[];
  activeProfile: KidsProfile; // Non-null - only render when profile exists
  onSwitchProfile: (id: string) => void;
  onAddNewProfile: () => void;
  onEditProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;

  // Rewards
  points: number;
  level: RewardLevel;
  progress: number;
  unlockedStickersCount: number;
  totalStickersCount: number;
  pointsEarned: number;
  onOpenStickers: () => void;

  // Sound & Voice
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isSpeaking: boolean;
  voiceSupported: boolean;

  // Music
  isMusicPlaying: boolean;
  isMusicLoaded: boolean;
  onToggleMusic: () => void;

  // Navigation
  onBack: () => void;
  onOpenMap: () => void;
}

/**
 * Chat header component with mobile and desktop layouts.
 * Handles DRY for RewardsBar props.
 */
export default function ChatHeader({
  profiles,
  activeProfile,
  onSwitchProfile,
  onAddNewProfile,
  onEditProfile,
  onDeleteProfile,
  points,
  level,
  progress,
  unlockedStickersCount,
  totalStickersCount,
  pointsEarned,
  onOpenStickers,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  isSpeaking,
  voiceSupported,
  isMusicPlaying,
  isMusicLoaded,
  onToggleMusic,
  onBack,
  onOpenMap,
}: ChatHeaderProps) {
  // DRY: Define rewardsBarProps once, used in both mobile and desktop
  const rewardsBarProps = {
    points,
    level,
    progress,
    unlockedStickersCount,
    totalStickersCount,
    pointsEarned,
    onOpenStickers,
    soundEnabled,
    onToggleSound,
    voiceEnabled,
    onToggleVoice,
    isSpeaking,
    voiceSupported,
  };

  return (
    <header className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 z-10">
      {/* ── Mobile: 2-row layout ── */}
      <div className="flex flex-col gap-1.5 md:hidden max-w-6xl mx-auto">
        {/* Row 2: map button + progress bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="shrink-0 flex items-center justify-center w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            aria-label="رجوع"
            title="رجوع"
          >
            <span className="text-lg">←</span>
          </button>
          <button
            onClick={onOpenMap}
            className="shrink-0 flex items-center justify-center w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            aria-label="فتح الخريطة"
            title="الخريطة"
          >
            <span className="text-lg">🗺️</span>
          </button>
          <div className="flex-1 min-w-0">
            <RewardsBar {...rewardsBarProps} />
          </div>
        </div>
      </div>

      {/* ── Desktop: single row ── */}
      <div className="hidden md:flex items-center gap-4 max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="shrink-0 flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl"
          aria-label="رجوع"
          title="رجوع"
        >
          <span className="text-xl">←</span>
        </button>

        <div className="flex-1 min-w-0">
          <RewardsBar {...rewardsBarProps} />
        </div>

        <button
          onClick={onToggleMusic}
          disabled={!isMusicLoaded}
          className="shrink-0 flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          aria-label={isMusicPlaying ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        >
          <span className="text-xl">{isMusicPlaying ? "🎵" : "🔇"}</span>
        </button>

        <SettingsMenu
          profiles={profiles}
          activeProfile={activeProfile}
          onSwitch={onSwitchProfile}
          onAddNew={onAddNewProfile}
          onEdit={onEditProfile}
          onDelete={onDeleteProfile}
        />
      </div>
    </header>
  );
}