"use client";

import { useState } from "react";
import { VideoResult } from "@/lib/types";

type Props = {
  video: VideoResult;
};

/**
 * VideoPlayer component - displays YouTube video embed
 */
export default function VideoPlayer({ video }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--background-secondary)] hover:border-[var(--ps-red)]/50 transition-colors"
      >
        <div className="relative">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-12 h-12 rounded-full bg-[var(--ps-red)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white mr-[-2px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2">{video.title}</p>
          <p className="text-[10px] text-[var(--foreground-secondary)] mt-1">شاهد على YouTube ↗</p>
        </div>
      </a>
    );
  }

  if (!isPlaying) {
    return (
      <button
        onClick={() => setIsPlaying(true)}
        className="block w-full rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--background-secondary)] hover:border-[var(--ps-red)]/50 transition-all group text-right"
      >
        <div className="relative">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-32 object-cover transition-transform group-hover:scale-105"
            onError={() => setHasError(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-[var(--ps-red)] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white mr-[-2px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {video.duration && (
            <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
              {video.duration}
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 leading-relaxed">
            {video.title}
          </p>
          {video.channelName && (
            <p className="text-[10px] text-[var(--foreground-secondary)] mt-1 flex items-center gap-1">
              <span className="text-[var(--ps-red)]">▶</span>
              {video.channelName}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-black">
      <div className="relative pt-[56.25%]">
        <iframe
          src={video.embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          onError={() => setHasError(true)}
        />
      </div>
      <div className="p-2 bg-[var(--background-secondary)]">
        <p className="text-[10px] text-[var(--foreground-secondary)] truncate">{video.title}</p>
      </div>
    </div>
  );
}
