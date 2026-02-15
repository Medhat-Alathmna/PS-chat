"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import dynamic from "next/dynamic";
import type { City } from "@/lib/data/cities";

const PalestineLeafletMap = dynamic(
  () => import("./PalestineLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-sky-100/30 rounded-2xl">
        <div className="w-6 h-6 border-2 border-[var(--kids-purple)]/30 border-t-[var(--kids-purple)] rounded-full animate-spin" />
      </div>
    ),
  }
);

interface ExpandableMapProps {
  /** Callback when a city is clicked */
  onCityClick?: (city: City) => void;
  /** Callback for "Ask Medhat about city" button in popup */
  onAskAboutCity?: (city: City) => void;
  /** City ID to highlight */
  highlightedCity?: string;
  /** Enable game mode with fog/reveal mechanics */
  gameMode?: boolean;
  /** City IDs that have been revealed (correct answers) */
  revealedCities?: string[];
  /** City ID to pulse as a region clue */
  highlightRegion?: string;
  /** City ID to auto-fly to (e.g. just-revealed city) */
  flyToCity?: string;
  /** Show map controls (search, filter, reset) */
  showControls?: boolean;
  /** Title to display in header */
  title?: string;
  /** Subtitle/stats text */
  subtitle?: string;
  /** Collapsed height (default: varies by size) */
  collapsedHeight?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Allow collapsing the map */
  collapsible?: boolean;
  /** Initially collapsed */
  initialCollapsed?: boolean;
  /** Custom class for container */
  className?: string;
  /** Incrementing counter to trigger auto-expand from parent */
  expandTrigger?: number;
}

function ExpandableMapBase({
  onCityClick,
  onAskAboutCity,
  highlightedCity,
  gameMode = false,
  revealedCities = [],
  highlightRegion,
  flyToCity,
  showControls = false,
  title = "🗺️ خريطة فلسطين",
  subtitle,
  collapsedHeight,
  size = "md",
  collapsible = false,
  initialCollapsed = false,
  className = "",
  expandTrigger = 0,
}: ExpandableMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Auto-expand when parent increments expandTrigger
  const prevTrigger = useRef(expandTrigger);
  useEffect(() => {
    if (expandTrigger > prevTrigger.current) {
      setIsExpanded(true);
      setIsCollapsed(false);
    }
    prevTrigger.current = expandTrigger;
  }, [expandTrigger]);

  // Size-based heights
  const sizeHeights = {
    sm: { collapsed: "h-32 sm:h-36", normal: "h-36 sm:h-40" },
    md: { collapsed: "h-40 sm:h-48", normal: "h-48 sm:h-56" },
    lg: { collapsed: "h-48 sm:h-56", normal: "h-56 sm:h-64" },
  };

  const heights = sizeHeights[size];
  const mapHeight = collapsedHeight || heights.normal;

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Fullscreen overlay
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 animate-fade-in">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={toggleExpand}
        />

        {/* Map container */}
        <div className="absolute inset-4 sm:inset-6 md:inset-10 lg:inset-16 flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-pop-in">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--kids-purple)] to-[var(--kids-blue)] text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🗺️</span>
              <span className="font-bold text-lg">خريطة فلسطين التفاعلية</span>
            </div>
            <button
              onClick={toggleExpand}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-105 active:scale-95"
              aria-label="إغلاق"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 min-h-0 p-2">
            <PalestineLeafletMap
              onCityClick={onCityClick}
              onAskAboutCity={onAskAboutCity}
              highlightedCity={highlightedCity}
              gameMode={gameMode}
              revealedCities={revealedCities}
              highlightRegion={highlightRegion}
              flyToCity={flyToCity}
              showControls={true}
              enableFullInteraction={true}
              className="h-full"
            />
          </div>

          {/* Footer hint */}
          <div className="shrink-0 px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
            اضغط على أي مدينة لمعرفة المزيد عنها 📍
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with title and controls */}
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
        <button
          onClick={collapsible ? toggleCollapse : undefined}
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--kids-purple)] ${collapsible ? "hover:opacity-80 cursor-pointer" : ""}`}
        >
          {collapsible && (
            <span className="text-[10px]">{isCollapsed ? "▶" : "▼"}</span>
          )}
          <span>{title}</span>
          {subtitle && (
            <span className="text-[10px] sm:text-xs font-normal text-gray-500">
              {subtitle}
            </span>
          )}
        </button>

        {/* Expand button */}
        <button
          onClick={toggleExpand}
          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[var(--kids-purple)] bg-white/80 hover:bg-white rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
          title="تكبير الخريطة"
        >
          <span>🔍</span>
          <span className="hidden sm:inline">تكبير</span>
        </button>
      </div>

      {/* Map container */}
      {!isCollapsed && (
        <div className={`bg-white/70 backdrop-blur-sm rounded-2xl p-1 sm:p-1.5 shadow-md overflow-hidden animate-fade-in ${mapHeight === "h-full" ? "flex-1 min-h-0" : ""}`}>
          <div className={mapHeight === "h-full" ? "h-full" : mapHeight}>
            <PalestineLeafletMap
              onCityClick={onCityClick}
              onAskAboutCity={onAskAboutCity}
              highlightedCity={highlightedCity}
              gameMode={gameMode}
              revealedCities={revealedCities}
              highlightRegion={highlightRegion}
              flyToCity={flyToCity}
              showControls={showControls}
              enableFullInteraction={true}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function arePropsEqual(prev: ExpandableMapProps, next: ExpandableMapProps): boolean {
  return (
    prev.highlightedCity === next.highlightedCity &&
    prev.gameMode === next.gameMode &&
    prev.highlightRegion === next.highlightRegion &&
    prev.flyToCity === next.flyToCity &&
    prev.showControls === next.showControls &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.collapsedHeight === next.collapsedHeight &&
    prev.size === next.size &&
    prev.collapsible === next.collapsible &&
    prev.initialCollapsed === next.initialCollapsed &&
    prev.className === next.className &&
    prev.onCityClick === next.onCityClick &&
    prev.onAskAboutCity === next.onAskAboutCity &&
    prev.expandTrigger === next.expandTrigger &&
    arraysEqual(prev.revealedCities, next.revealedCities)
  );
}

export default memo(ExpandableMapBase, arePropsEqual);
