"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

  const processedTools = useRef(new Set<string>());
  const latestPageRef = useRef(
    Math.max(0, ...story.pages.map((p) => p.pageNumber))
  );
  const startSentRef = useRef(false);

  // Transport is created once — story.config is guaranteed non-null here
  const { messages: aiMessages, sendMessage, status } = useChat({
    transport: useMemo(
      () =>
        new DefaultChatTransport({
          api: "/api/stories/chat",
          body: {
            storyConfig: story.config,
            kidsProfile: activeProfile,
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [] // intentionally stable — config never changes for this story session
    ),
  });

  const isGenerating = status === "streaming" || status === "submitted";

  // Auto-send start message for new stories
  useEffect(() => {
    if (isNew && !startSentRef.current && !story.completed) {
      startSentRef.current = true;
      sendMessage({ text: "ابدأ القصة!" });
    }
  }, [isNew, story.completed, sendMessage]);

  // Process AI tool outputs
  useEffect(() => {
    for (const msg of aiMessages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (!part.type.startsWith("tool-")) continue;
        const toolPart = part as {
          type: string;
          toolCallId: string;
          state: string;
          output?: Record<string, unknown>;
        };

        if (
          toolPart.state !== "output-available" ||
          !toolPart.output ||
          processedTools.current.has(toolPart.toolCallId)
        ) {
          continue;
        }

        processedTools.current.add(toolPart.toolCallId);
        const toolName = toolPart.type.replace("tool-", "");

        if (toolName === "story_page") {
          const page: StoryPage = {
            pageNumber: toolPart.output.pageNumber as number,
            text: toolPart.output.text as string,
          };
          latestPageRef.current = Math.max(latestPageRef.current, page.pageNumber);
          setLivePages((prev) => {
            if (prev.some((p) => p.pageNumber === page.pageNumber)) return prev;
            return [...prev, page];
          });
          addPage(storyId, page);
        } else if (toolName === "story_choice") {
          const output = toolPart.output as {
            prompt: string;
            choices: { id: string; emoji: string; textAr: string }[];
          };
          const choicePoint: StoryChoicePoint = {
            prompt: output.prompt,
            choices: output.choices,
            afterPage: latestPageRef.current,
          };
          setLiveChoicePoints((prev) => {
            if (prev.some((cp) => cp.afterPage === choicePoint.afterPage)) return prev;
            addChoicePoint(storyId, choicePoint);
            return [...prev, choicePoint];
          });
        } else if (toolName === "end_story") {
          const title = toolPart.output.titleAr as string;
          setStoryTitle(title);
          setIsComplete(true);
          completeStory(storyId, title);
        }
      }
    }
  }, [aiMessages, storyId, addPage, addChoicePoint, completeStory]);

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
      if (choice) sendMessage({ text: choice.textAr });
    },
    [storyId, selectChoice, liveChoicePoints, sendMessage]
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
            isGenerating={isGenerating && !isComplete}
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
