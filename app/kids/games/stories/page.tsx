"use client";

import { useRouter } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useStories } from "@/lib/hooks/useStories";
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import StoryBookCover from "../../../components/kids/stories/StoryBookCover";
import ErrorBoundary from "../../../components/ErrorBoundary";

export default function StoriesPage() {
  return (
    <ErrorBoundary>
      <StoriesHome />
    </ErrorBoundary>
  );
}

function StoriesHome() {
  const router = useRouter();
  const { activeProfile, isLoaded } = useProfiles();
  const profileId = activeProfile?.id;
  const { stories, isLoaded: storiesLoaded } = useStories(profileId);

  if (!isLoaded || !storiesLoaded) return null;

  if (!activeProfile) {
    router.push("/kids/games");
    return null;
  }

  const completedStories = stories.filter((s) => s.completed);
  const inProgressStories = stories.filter((s) => !s.completed);

  return (
    <AnimatedBackground variant="night" showStars showClouds={false} showBirds={false}>
      <div className="relative flex h-screen flex-col overflow-hidden" dir="rtl">
        {/* Header */}
        <header className="shrink-0 px-4 pt-4 pb-2 z-10">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button
              onClick={() => router.push("/kids/games")}
              className="text-white/70 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              رجوع
            </button>
            <h1 className="text-white font-bold text-xl">📖🌙 احكيلي قصة!</h1>
            <div className="w-12" />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-lg pb-24">
            {/* Create button */}
            <button
              onClick={() => router.push("/kids/games/stories/create")}
              className="w-full mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all border-2 border-white/20"
            >
              <span className="text-3xl block mb-1">✨</span>
              ابدأ قصة جديدة!
            </button>

            {/* In-progress stories */}
            {inProgressStories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white/70 text-sm font-medium mb-3">
                  قصص لم تكتمل بعد
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {inProgressStories.map((story) => (
                    <StoryBookCover
                      key={story.id}
                      story={story}
                      onClick={() =>
                        router.push(`/kids/games/stories/${story.id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed stories */}
            {completedStories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white/70 text-sm font-medium mb-3">
                  مكتبتي 📚
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {completedStories.map((story) => (
                    <StoryBookCover
                      key={story.id}
                      story={story}
                      onClick={() =>
                        router.push(`/kids/games/stories/${story.id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {stories.length === 0 && (
              <div className="text-center mt-8">
                <div className="text-5xl mb-3">🌙</div>
                <p className="text-white/50 text-sm">
                  لم تكتب أي قصة بعد... ابدأ مغامرتك الأولى!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
}
