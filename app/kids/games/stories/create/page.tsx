"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useStories } from "@/lib/hooks/useStories";
import AnimatedBackground from "../../../../components/kids/AnimatedBackground";
import StoryWizard from "../../../../components/kids/stories/StoryWizard";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import type { StoryConfig, StoryGenre } from "@/lib/types/stories";
import { STORY_GENRES } from "@/lib/data/stories/config";

export default function CreateStoryPage() {
  return (
    <ErrorBoundary>
      <CreateStory />
    </ErrorBoundary>
  );
}

function CreateStory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProfile, isLoaded } = useProfiles();
  const profileId = activeProfile?.id;
  const { createStory } = useStories(profileId);

  if (!isLoaded) return null;

  if (!activeProfile) {
    router.push("/kids/games");
    return null;
  }

  // Read ?genre= param from quick-start chips
  const genreParam = searchParams.get("genre");
  const preSelectedGenre =
    genreParam && STORY_GENRES.some((g) => g.id === genreParam)
      ? (genreParam as StoryGenre)
      : undefined;

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
          preSelectedGenre={preSelectedGenre}
          profileAge={activeProfile.age}
        />
      </div>
    </AnimatedBackground>
  );
}
