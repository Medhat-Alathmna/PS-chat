"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import ProfileSetup from "@/app/components/kids/ProfileSetup";
import KidsIntroScreen from "@/app/components/kids/KidsIntroScreen";
import ErrorBoundary from "@/app/components/ErrorBoundary";
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
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const {
    profiles,
    activeProfile,
    isLoaded,
    createProfile,
    updateProfile,
    switchProfile,
    deleteProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;
  const { points, level } = useRewards(profileId);
  const { isPlaying: isMusicPlaying, toggle: toggleMusic, isLoaded: isMusicLoaded } = useBackgroundMusicContext();

  // Loading state
  if (!isLoaded) return null;

  // No profiles yet - show profile setup
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
        router.push(`/chat?q=${encodeURIComponent(text)}`);
      }}
      points={points}
      level={level}
      playerName={activeProfile.name}
      isMusicPlaying={isMusicPlaying}
      isMusicLoaded={isMusicLoaded}
      onToggleMusic={toggleMusic}
      profiles={profiles}
      activeProfile={activeProfile}
      onSwitchProfile={switchProfile}
      onAddNewProfile={() => setShowProfileSetup(true)}
      onEditProfile={() => setShowProfileSetup(true)}
      onDeleteProfile={deleteProfile}
    />
  );
}