"use client";

import { useRouter } from "next/navigation";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useStories } from "@/lib/hooks/useStories";
import AnimatedBackground from "../../../components/kids/AnimatedBackground";
import StoryBookCover from "../../../components/kids/stories/StoryBookCover";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { STORY_GENRES } from "@/lib/data/stories/config";
import type { StoryGenre, StoryConfig } from "@/lib/types/stories";

export default function StoriesPage() {
  return (
    <ErrorBoundary>
      <StoriesHome />
    </ErrorBoundary>
  );
}

const RANDOM_SETTINGS = ["jerusalem", "nablus", "jaffa", "gaza", "bethlehem", "hebron", "acre", "enchanted-forest", "flying-castle", "underwater-kingdom"] as const;
const RANDOM_COMPANIONS = ["medhat", "self"] as const;
const RANDOM_LENGTHS = ["short", "medium", "long"] as const;
const RANDOM_MODES = ["interactive", "continuous"] as const;

function randomConfig(): StoryConfig {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    genre: pick(STORY_GENRES).id,
    setting: pick(RANDOM_SETTINGS),
    companion: pick(RANDOM_COMPANIONS),
    length: pick(RANDOM_LENGTHS),
    mode: pick(RANDOM_MODES),
  };
}

function StoriesHome() {
  const router = useRouter();
  const { activeProfile, isLoaded } = useProfiles();
  const profileId = activeProfile?.id;
  const { stories, isLoaded: storiesLoaded, deleteStory, createStory } = useStories(profileId);

  if (!isLoaded || !storiesLoaded) return null;

  if (!activeProfile) {
    router.push("/kids/games");
    return null;
  }

  const completedStories = stories.filter((s) => s.completed);
  const inProgressStories = stories.filter((s) => !s.completed);

  const handleSurpriseMe = () => {
    const config = randomConfig();
    const storyId = createStory(config);
    router.push(`/kids/games/stories/${storyId}?new=true`);
  };

  const handleGenreQuickStart = (genre: StoryGenre) => {
    router.push(`/kids/games/stories/create?genre=${genre}`);
  };

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
          <div className="mx-auto max-w-lg pb-[max(6rem,env(safe-area-inset-bottom,0px)+4rem)] space-y-4">

            {/* ── Surprise Me hero card ── */}
            <button
              onClick={handleSurpriseMe}
              className="w-full p-5 rounded-2xl text-white font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all border-2 border-white/25 overflow-hidden relative touch-manipulation"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #F59E0B 100%)",
              }}
            >
              {/* Sparkle overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden>
                {["✦", "⭐", "✧", "✨", "⋆"].map((char, i) => (
                  <span
                    key={i}
                    className="absolute text-white/50 select-none"
                    style={{
                      left: `${15 + i * 17}%`,
                      top: `${10 + (i % 3) * 30}%`,
                      fontSize: `${0.7 + (i % 3) * 0.3}rem`,
                      animation: `floatParticle ${2 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <span className="text-3xl block mb-1">✨</span>
              <span className="text-xl block">فاجئني بقصة!</span>
              <span className="text-white/75 text-sm font-normal block mt-1">
                اضغط لقصة مفاجأة من اختيار القدر 🎲
              </span>
            </button>

            {/* ── Genre quick-start grid ── */}
            <div>
              <p className="text-white/60 text-xs font-medium mb-2 px-1">أو ابدأ بنوع معين...</p>
              <div className="grid grid-cols-3 gap-2">
                {STORY_GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreQuickStart(g.id)}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border-2 bg-white/5 active:scale-95 transition-all touch-manipulation"
                    style={{ borderColor: `${g.color}55` }}
                  >
                    <span className="text-3xl">{g.emoji}</span>
                    <span className="text-white/90 text-xs font-medium">{g.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Create new button (secondary) ── */}
            <button
              onClick={() => router.push("/kids/games/stories/create")}
              className="w-full p-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border-2 border-white/15 hover:border-white/30 active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
            >
              <span className="text-xl">📖</span>
              اختر قصتك بنفسك
            </button>

            {/* ── In-progress stories ── */}
            {inProgressStories.length > 0 && (
              <div>
                <h2 className="text-white/70 text-sm font-medium mb-3">
                  قصص لم تكتمل بعد
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {inProgressStories.map((story) => (
                    <StoryBookCover
                      key={story.id}
                      story={story}
                      onClick={() => router.push(`/kids/games/stories/${story.id}`)}
                      onDelete={() => deleteStory(story.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Completed stories ── */}
            {completedStories.length > 0 && (
              <div>
                <h2 className="text-white/70 text-sm font-medium mb-3">
                  مكتبتي 📚
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {completedStories.map((story) => (
                    <StoryBookCover
                      key={story.id}
                      story={story}
                      onClick={() => router.push(`/kids/games/stories/${story.id}`)}
                      onDelete={() => deleteStory(story.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {stories.length === 0 && (
              <div className="text-center mt-6">
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
