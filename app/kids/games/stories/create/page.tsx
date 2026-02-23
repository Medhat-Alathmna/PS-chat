"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useStories } from "@/lib/hooks/useStories";
import { useStoryMusic } from "@/lib/hooks/useStoryMusic";
import { useBackgroundMusicContext } from "../../../layout";
import AnimatedBackground from "../../../../components/kids/AnimatedBackground";
import StoryWizard from "../../../../components/kids/stories/StoryWizard";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import type { StoryConfig } from "@/lib/types/stories";

export default function CreateStoryPage() {
  return (
    <ErrorBoundary>
      <CreateStory />
    </ErrorBoundary>
  );
}

function CreateStory() {
  const router = useRouter();
  const { activeProfile, isLoaded } = useProfiles();
  const profileId = activeProfile?.id;
  const { createStory } = useStories(profileId);
  
  // Story music management
  const storyMusic = useStoryMusic();
  const backgroundMusic = useBackgroundMusicContext();
  
  // Track if main music was playing when we entered
  const wasMainMusicPlaying = useRef(false);
  
  // Switch to story music when entering this page
  useEffect(() => {
    // Remember if main music was playing
    wasMainMusicPlaying.current = backgroundMusic.isPlaying;
    
    // Pause main background music first
    if (backgroundMusic.isPlaying) {
      backgroundMusic.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Play story music when it's loaded (only if main music was playing)
  useEffect(() => {
    if (storyMusic.isLoaded && wasMainMusicPlaying.current) {
      storyMusic.play();
    }
    
    // Cleanup: stop story music when leaving
    return () => {
      storyMusic.pause();
    };
  }, [storyMusic.isLoaded]);
  
  // Resume main music when leaving the page (only if it was playing before)
  useEffect(() => {
    return () => {
      if (wasMainMusicPlaying.current) {
        backgroundMusic.play();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoaded) return null;

  if (!activeProfile) {
    router.push("/kids/games");
    return null;
  }

  const handleComplete = (config: StoryConfig) => {
    const storyId = createStory(config);
    router.push(`/kids/games/stories/${storyId}?new=true`);
  };

  return (
    <AnimatedBackground variant="night" showStars showClouds={false} showBirds={false}>
      <div className="h-screen">
        <StoryWizard
          onComplete={handleComplete}
          onBack={() => router.push("/kids/games/stories")}
        />
      </div>
    </AnimatedBackground>
  );
}
