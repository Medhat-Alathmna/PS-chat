"use client";

import { useRouter } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import ProfileSetup from "../components/kids/ProfileSetup";
import KidsIntroScreen from "../components/kids/KidsIntroScreen";
import ErrorBoundary from "../components/ErrorBoundary";
import { useBackgroundMusicContext } from "./layout";

export default function KidsHomePage() {
  return (
    <ErrorBoundary>
      <KidsHomeInner />
    </ErrorBoundary>
  );
}

function KidsHomeInner() {
  const router = useRouter();
  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;
  const { points, level } = useRewards(profileId);
  const { isPlaying: isMusicPlaying, toggle: toggleMusic, isLoaded: isMusicLoaded } = useBackgroundMusicContext();

  // Loading state
  if (!isLoaded) return null;

  // No profiles yet - show profile setup
  if (profiles.length === 0) {
    return (
      <ProfileSetup
        onComplete={(data) => {
          createProfile(data);
        }}
        existingProfiles={profiles}
      />
    );
  }

  // Migrated profile with no name — prompt for name completion
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

  // Show intro screen with navigation to chat
  return (
    <KidsIntroScreen
      onSelect={(text) => {
        // Navigate to chat with the selected question
        router.push(`/kids/chat?q=${encodeURIComponent(text)}`);
      }}
      points={points}
      level={level}
      playerName={activeProfile.name}
      isMusicPlaying={isMusicPlaying}
      isMusicLoaded={isMusicLoaded}
      onToggleMusic={toggleMusic}
    />
  );
}
