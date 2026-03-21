"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useRewards } from "@/lib/hooks/useRewards";
import ProfileSetup from "../components/kids/ProfileSetup";
import KidsIntroScreen from "../components/kids/KidsIntroScreen";
import ProfilesLoadingOverlay from "../components/kids/ProfilesLoadingOverlay";
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
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const {
    profiles,
    activeProfile,
    isLoaded,
    isApiPending,
    createProfile,
    updateProfile,
    switchProfile,
    deleteProfile,
  } = useProfiles();

  const profileId = activeProfile?.id;
  const { points, level } = useRewards(profileId);
  const { isPlaying: isMusicPlaying, toggle: toggleMusic, isLoaded: isMusicLoaded } = useBackgroundMusicContext();

  // Loading state
  if (!isLoaded) return <ProfilesLoadingOverlay />;

  // Edit existing profile
  if (editingProfileId) {
    const profileToEdit = profiles.find((p) => p.id === editingProfileId);
    return (
      <ProfileSetup
        onComplete={(data) => {
          updateProfile(editingProfileId, data);
          setEditingProfileId(null);
        }}
        existingProfiles={profiles.filter((p) => p.id !== editingProfileId)}
        onCancel={() => setEditingProfileId(null)}
        initialData={profileToEdit ? { name: profileToEdit.name, age: profileToEdit.age, avatar: profileToEdit.avatar, color: profileToEdit.color } : undefined}
      />
    );
  }

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
    <>
    {isApiPending && <ProfilesLoadingOverlay />}
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
      onEditProfile={(id) => setEditingProfileId(id)}
      onDeleteProfile={deleteProfile}
    />
    </>
  );
}
