"use client";

import type { SavedStory } from "@/lib/types/stories";
import { getGenreOption } from "@/lib/data/stories/config";

interface StoryBookCoverProps {
  story: SavedStory;
  onClick: () => void;
}

export default function StoryBookCover({ story, onClick }: StoryBookCoverProps) {
  const genre = getGenreOption(story.config.genre);

  const title = story.titleAr || "قصة بلا عنوان...";
  const date = new Date(story.createdAt).toLocaleDateString("ar-PS", {
    month: "short",
    day: "numeric",
  });

  return (
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
  );
}
