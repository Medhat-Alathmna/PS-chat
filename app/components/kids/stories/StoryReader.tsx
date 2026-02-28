"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StoryPage as StoryPageType, StoryChoicePoint } from "@/lib/types/stories";
import StoryPage from "./StoryPage";
import StoryChoiceCards from "./StoryChoiceCards";

interface StoryReaderProps {
  pages: StoryPageType[];
  choicePoints: StoryChoicePoint[];
  totalPages?: number;
  isGenerating?: boolean;
  onSelectChoice?: (afterPage: number, choiceId: string) => void;
  textStyle?: { fontFamily: string; fontSize: string };
}

type SlideItem =
  | { type: "page"; page: StoryPageType }
  | { type: "choice"; choicePoint: StoryChoicePoint };

type AnimState = "idle" | "leaving" | "entering";

export default function StoryReader({
  pages,
  choicePoints,
  totalPages,
  isGenerating,
  onSelectChoice,
  textStyle,
}: StoryReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const pendingIndex = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build ordered slide list: pages interspersed with choice points
  const slides: SlideItem[] = [];
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const choiceMap = new Map(choicePoints.map((cp) => [cp.afterPage, cp]));

  for (const page of sortedPages) {
    slides.push({ type: "page", page });
    const cp = choiceMap.get(page.pageNumber);
    if (cp) slides.push({ type: "choice", choicePoint: cp });
  }

  const maxIndex = slides.length - 1;

  // Navigate with card stack animation
  const goTo = useCallback(
    (target: number) => {
      if (animState !== "idle" || target === currentIndex || target < 0 || target > maxIndex) return;
      pendingIndex.current = target;
      setAnimState("leaving");
    },
    [animState, currentIndex, maxIndex]
  );

  const goNext = useCallback(() => {
    if (currentIndex < maxIndex) goTo(currentIndex + 1);
  }, [currentIndex, maxIndex, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Animation state machine: leaving → (update index) → entering → idle
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return; // ignore bubbled events
      if (animState === "leaving") {
        setCurrentIndex(pendingIndex.current);
        setAnimState("entering");
      } else if (animState === "entering") {
        setAnimState("idle");
      }
    },
    [animState]
  );

  // Auto-advance when new slides arrive
  const prevSlidesLen = useRef(slides.length);
  useEffect(() => {
    if (slides.length > prevSlidesLen.current) {
      const wasEmpty = prevSlidesLen.current === 0;
      const wasOnLast = currentIndex >= prevSlidesLen.current - 1;

      if (wasEmpty) {
        setCurrentIndex(0);
      } else if (wasOnLast && animState === "idle") {
        goNext();
      }
    }
    prevSlidesLen.current = slides.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // Swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // RTL: swipe left = next, swipe right = prev
        if (deltaX < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goNext(); // RTL: left = forward
      if (e.key === "ArrowRight") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // Loading / empty state
  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📖</div>
          <p className="text-white/70 text-sm">
            {isGenerating ? "يكتب القصة..." : "القصة تبدأ الآن..."}
          </p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const remaining = slides.length - currentIndex - 1;

  const cardClass = [
    "story-card-current",
    animState === "leaving" ? "story-card-leave" : "",
    animState === "entering" ? "story-card-enter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card stack area */}
      <div className="relative flex-1 pb-4">
        {/* Ghost cards — blank frosted glass peeking behind */}
        {remaining >= 2 && (
          <div className="story-ghost story-ghost-2">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 min-h-[60vh]" />
          </div>
        )}
        {remaining >= 1 && (
          <div className="story-ghost story-ghost-1">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 min-h-[60vh]" />
          </div>
        )}

        {/* Current card */}
        <div
          key={currentIndex}
          className={cardClass}
          onAnimationEnd={handleAnimationEnd}
        >
          {currentSlide.type === "page" ? (
            <StoryPage
              text={currentSlide.page.text}
              pageNumber={currentSlide.page.pageNumber}
              totalPages={totalPages}
              textStyle={textStyle}
            />
          ) : (
            <StoryChoiceCards
              prompt={currentSlide.choicePoint.prompt}
              choices={currentSlide.choicePoint.choices}
              selectedId={currentSlide.choicePoint.selectedChoiceId}
              disabled={!!currentSlide.choicePoint.selectedChoiceId}
              onSelect={(choiceId) => {
                if (onSelectChoice) {
                  onSelectChoice(currentSlide.choicePoint.afterPage, choiceId);
                }
              }}
            />
          )}
        </div>

        {/* Navigation arrows — desktop */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-10"
            aria-label="الصفحة السابقة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {currentIndex < maxIndex && (
          <button
            onClick={goNext}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-10"
            aria-label="الصفحة التالية"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i !== currentIndex) goTo(i);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              i === currentIndex ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Loading indicator — shown while generating more pages */}
      {isGenerating && (
        <div className="text-center pb-2">
          <span className="text-white/50 text-xs animate-pulse">يكتب القصة...</span>
        </div>
      )}
    </div>
  );
}
