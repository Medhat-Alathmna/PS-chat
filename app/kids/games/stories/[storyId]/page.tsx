"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useStories } from "@/lib/hooks/useStories";
import { useTextSettings, getTextStyleValues } from "@/lib/hooks/useTextSettings";
import AnimatedBackground from "../../../../components/kids/AnimatedBackground";
import StoryReader from "../../../../components/kids/stories/StoryReader";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import type { SavedStory, StoryPage, StoryChoicePoint } from "@/lib/types/stories";
import type { KidsProfile } from "@/lib/types/games";

export default function StoryReaderPage() {
  return (
    <ErrorBoundary>
      <StoryReaderInner />
    </ErrorBoundary>
  );
}

function StoryReaderInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const storyId = params.storyId as string;
  const isNew = searchParams.get("new") === "true";

  const { activeProfile, isLoaded } = useProfiles();
  const profileId = activeProfile?.id;
  const { getStory, addPage, addChoicePoint, selectChoice, completeStory } =
    useStories(profileId);
  const { settings: textSettings } = useTextSettings(profileId);
  const textStyle = getTextStyleValues(textSettings);

  const story = getStory(storyId);

  if (!isLoaded) return null;

  if (!activeProfile) {
    router.push("/kids/games");
    return null;
  }

  if (!story) {
    return (
      <AnimatedBackground variant="night" showStars showClouds={false} showBirds={false}>
        <div className="flex items-center justify-center h-screen" dir="rtl">
          <div className="text-center">
            <div className="text-4xl mb-3">😕</div>
            <p className="text-white/70 text-sm mb-4">هذه القصة غير موجودة</p>
            <button
              onClick={() => router.push("/kids/games/stories")}
              className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all"
            >
              رجوع للمكتبة 📚
            </button>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <StorySession
      storyId={storyId}
      isNew={isNew}
      story={story}
      activeProfile={activeProfile}
      textStyle={textStyle}
      addPage={addPage}
      addChoicePoint={addChoicePoint}
      selectChoice={selectChoice}
      completeStory={completeStory}
    />
  );
}

// ── Inner session component — only mounts once story is confirmed loaded ──

interface StorySessionProps {
  storyId: string;
  isNew: boolean;
  story: SavedStory;
  activeProfile: KidsProfile;
  textStyle: { fontFamily: string; fontSize: string };
  addPage: (storyId: string, page: StoryPage) => void;
  addChoicePoint: (storyId: string, cp: StoryChoicePoint) => void;
  selectChoice: (storyId: string, afterPage: number, choiceId: string) => void;
  completeStory: (storyId: string, titleAr: string) => void;
}

function StorySession({
  storyId,
  isNew,
  story,
  activeProfile,
  textStyle,
  addPage,
  addChoicePoint,
  selectChoice,
  completeStory,
}: StorySessionProps) {
  const router = useRouter();

  const [livePages, setLivePages] = useState<StoryPage[]>(story.pages);
  const [liveChoicePoints, setLiveChoicePoints] = useState<StoryChoicePoint[]>(
    story.choicePoints
  );
  const [storyTitle, setStoryTitle] = useState<string | undefined>(story.titleAr);
  const [isComplete, setIsComplete] = useState(story.completed);
  const [isLoading, setIsLoading] = useState(false);

  const startSentRef = useRef(false);

  const generateNextBatch = useCallback(
    async (userMessage: string, lastChoiceText?: string) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/stories/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", parts: [{ type: "text", text: userMessage }] }],
            storyConfig: story.config,
            kidsProfile: activeProfile,
            previousPages: livePages,
            lastChoiceText,
          }),
        });

        if (!res.ok) {
          console.error("[stories] API error:", res.status);
          return;
        }

        const data = await res.json();

        data.pages?.forEach((page: StoryPage) => {
          addPage(storyId, page);
          setLivePages((prev) =>
            prev.some((p) => p.pageNumber === page.pageNumber) ? prev : [...prev, page]
          );
        });

        if (data.choicePoint && data.pages?.length > 0) {
          const cp: StoryChoicePoint = {
            ...data.choicePoint,
            afterPage: Math.max(...(data.pages as StoryPage[]).map((p) => p.pageNumber)),
          };
          addChoicePoint(storyId, cp);
          setLiveChoicePoints((prev) => [...prev, cp]);
        }

        if (data.ended) {
          setStoryTitle(data.ended.titleAr);
          setIsComplete(true);
          completeStory(storyId, data.ended.titleAr);
        }
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [livePages, story.config, activeProfile, storyId, addPage, addChoicePoint, completeStory]
  );

  // Auto-start for new stories
  useEffect(() => {
    if (isNew && !startSentRef.current && !story.completed) {
      startSentRef.current = true;
      generateNextBatch("ابدأ القصة!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle choice selection
  const handleSelectChoice = useCallback(
    (afterPage: number, choiceId: string) => {
      selectChoice(storyId, afterPage, choiceId);
      setLiveChoicePoints((prev) =>
        prev.map((cp) =>
          cp.afterPage === afterPage ? { ...cp, selectedChoiceId: choiceId } : cp
        )
      );
      const cp = liveChoicePoints.find((c) => c.afterPage === afterPage);
      const choice = cp?.choices.find((c) => c.id === choiceId);
      if (choice) generateNextBatch(choice.textAr, choice.textAr);
    },
    [storyId, selectChoice, liveChoicePoints, generateNextBatch]
  );

  const totalPages = { short: 5, medium: 8, long: 12 }[story.config.length];

  return (
    <AnimatedBackground variant="night" showStars showClouds={false} showBirds={false}>
      <div className="flex flex-col h-screen" dir="rtl">
        {/* Header */}
        <header className="shrink-0 px-4 pt-3 pb-1 z-10">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button
              onClick={() => router.push("/kids/games/stories")}
              className="text-white/70 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              المكتبة
            </button>
            <h2 className="text-white/80 font-medium text-sm truncate max-w-[200px]">
              {storyTitle || "قصة جديدة..."}
            </h2>
            <div className="w-12" />
          </div>
        </header>

        {/* Story reader */}
        <div className="flex-1 min-h-0">
          <StoryReader
            pages={livePages}
            choicePoints={liveChoicePoints}
            totalPages={totalPages}
            isGenerating={isLoading && !isComplete}
            onSelectChoice={isNew && !isComplete && story.config.mode !== "continuous" ? handleSelectChoice : undefined}
            textStyle={textStyle}
          />
        </div>

        {/* Completion footer */}
        {isComplete && (
          <div className="shrink-0 px-4 pb-4 pt-2 z-10">
            <div className="max-w-sm mx-auto text-center">
              <p className="text-white/60 text-xs mb-2">انتهت القصة 🌙</p>
              <button
                onClick={() => router.push("/kids/games/stories")}
                className="w-full py-3 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/20"
              >
                رجوع للمكتبة 📚
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatedBackground>
  );
}
