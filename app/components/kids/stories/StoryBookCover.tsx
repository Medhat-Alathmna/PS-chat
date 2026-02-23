"use client";

import { useState, useRef, useEffect } from "react";
import type { SavedStory } from "@/lib/types/stories";
import { getGenreOption } from "@/lib/data/stories/config";

interface StoryBookCoverProps {
  story: SavedStory;
  onClick: () => void;
  onDelete?: () => void;
}

export default function StoryBookCover({ story, onClick, onDelete }: StoryBookCoverProps) {
  const genre = getGenreOption(story.config.genre);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title = story.titleAr || "قصة بلا عنوان...";
  const date = new Date(story.createdAt).toLocaleDateString("ar-PS", {
    month: "short",
    day: "numeric",
  });

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group text-right"
        style={{
          background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}88, #1e1b4b)`,
        }}
      >
        {/* Stars decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
              style={{
                top: `${10 + (i * 37) % 80}%`,
                left: `${5 + (i * 43) % 90}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Genre emoji */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <span className="text-5xl drop-shadow-lg group-hover:animate-bounce">
            {genre.emoji}
          </span>
        </div>

        {/* Title area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 mb-1">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs">{date}</span>
            {story.completed && (
              <span className="text-xs bg-white/20 text-white/90 px-2 py-0.5 rounded-full">
                مكتملة
              </span>
            )}
          </div>
        </div>

        {/* Book spine effect */}
        <div className="absolute top-0 bottom-0 right-0 w-2 bg-black/20" />
      </button>

      {/* 3-dot menu button */}
      <div ref={menuRef} className="absolute top-2 left-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all"
          aria-label="خيارات"
        >
          <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute top-9 left-0 min-w-[120px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-white/10 transition-colors text-sm font-medium"
                dir="rtl"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
