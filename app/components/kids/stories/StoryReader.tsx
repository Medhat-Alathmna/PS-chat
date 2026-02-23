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

type SlideDirection = "next" | "prev" | "none";

export default function StoryReader({
  pages,
  choicePoints,
  totalPages,
  isGenerating,
  onSelectChoice,
  textStyle,
}: StoryReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("none");
  const [isAnimating, setIsAnimating] = useState(false);
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
    if (cp) {
      slides.push({ type: "choice", choicePoint: cp });
    }
  }

  const maxIndex = slides.length - 1;

  // Auto-advance: only go to first page when slides first appear,
  // or advance if user is already on the last slide (following along)
  const prevSlidesLen = useRef(slides.length);
  useEffect(() => {
    if (slides.length > prevSlidesLen.current) {
      const wasEmpty = prevSlidesLen.current === 0;
      const wasOnLast = currentIndex >= prevSlidesLen.current - 1;

      if (wasEmpty) {
        // First page arrived — show it immediately (no animation)
        setCurrentIndex(0);
      } else if (wasOnLast) {
        // User was on the last slide — auto-advance one step
        setSlideDirection("next");
        setIsAnimating(true);
        setCurrentIndex(prevSlidesLen.current); // one step forward, not the end
      }
      // Otherwise: user is browsing earlier pages — don't move them
    }
    prevSlidesLen.current = slides.length;
  }, [slides.length, currentIndex]);

  const navigateTo = useCallback(
    (target: number, direction: SlideDirection) => {
      if (isAnimating) return;
      setSlideDirection(direction);
      setIsAnimating(true);
      setCurrentIndex(target);
    },
    [isAnimating]
  );

  const goNext = useCallback(() => {
    if (currentIndex < maxIndex) navigateTo(currentIndex + 1, "next");
  }, [currentIndex, maxIndex, navigateTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) navigateTo(currentIndex - 1, "prev");
  }, [currentIndex, navigateTo]);

  // Clear animation flag after transition ends
  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
    setSlideDirection("none");
  }, []);

  // Swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Only trigger on horizontal swipes > 50px and mostly horizontal
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

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📖</div>
          <p className="text-white/70 text-sm">القصة تبدأ الآن...</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  // Animation class based on direction
  const animationClass =
    slideDirection === "next"
      ? "animate-slide-in-from-left"
      : slideDirection === "prev"
        ? "animate-slide-in-from-right"
        : "";

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide content */}
      <div
        key={currentIndex}
        className={`flex-1 ${animationClass}`}
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

      {/* Navigation arrows - desktop */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
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
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          aria-label="الصفحة التالية"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i !== currentIndex) {
                navigateTo(i, i > currentIndex ? "next" : "prev");
              }
            }}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              i === currentIndex
                ? "bg-white w-6"
                : i > currentIndex && i >= prevSlidesLen.current - 1 && isGenerating
                  ? "bg-white/30 animate-pulse"
                  : "bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* New page indicator — shown when there are unread pages ahead */}
      {isGenerating && currentIndex < maxIndex && (
        <div className="text-center pb-2">
          <button
            onClick={goNext}
            className="text-white/70 text-xs animate-pulse hover:text-white transition-colors"
          >
            صفحات جديدة ← اسحب للمتابعة
          </button>
        </div>
      )}

      {/* Loading indicator — shown when user is on the last slide */}
      {isGenerating && currentIndex === maxIndex && (
        <div className="text-center pb-2">
          <span className="text-white/50 text-xs animate-pulse">
            يكتب القصة...
          </span>
        </div>
      )}
    </div>
  );
}
