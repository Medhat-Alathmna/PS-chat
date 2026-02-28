"use client";

import { useEffect, useRef, useState } from "react";

const CACHE_NAME = "falastin-story-audio-cache-v1";
const STORY_MUSIC_PREF_KEY = "falastin_story_music_playing";

/**
 * Cache audio file for faster loading
 */
async function cacheAudioFile(audioPath: string): Promise<string> {
  // Check if Cache API is supported
  if (!("caches" in window)) {
    return audioPath;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const fullUrl = new URL(audioPath, window.location.origin).href;

    // Check if already cached
    const cachedResponse = await cache.match(fullUrl);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    // Fetch and cache the audio file
    const response = await fetch(fullUrl);
    if (response.ok) {
      // Clone response before caching (can only read once)
      await cache.put(fullUrl, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error("Error caching story audio:", error);
  }

  return audioPath;
}

/**
 * Hook for managing story-specific background music
 * Separate from main app background music
 * Used in story pages: library, create, and reader
 */
export function useStoryMusic(
  audioPath: string = "/sounds/night%20stories%20music.ogg"
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false); // Track pending play requests
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Initialize audio element with caching
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function initializeAudio() {
      try {
        // Get cached or cache the audio file
        const cachedUrl = await cacheAudioFile(audioPath);

        if (!isMounted) return;

        // Store object URL for cleanup
        if (cachedUrl.startsWith("blob:")) {
          objectUrlRef.current = cachedUrl;
        }

        const audio = new Audio(cachedUrl);
        audio.loop = true; // Enable loop
        audio.volume = 0.5; // Set comfortable volume (25%) - slightly lower than main music
        audio.preload = "auto";

        // Handle audio load
        audio.addEventListener("canplaythrough", () => {
          if (isMounted) {
            setIsLoaded(true);
          }
        });

        // Handle audio end (force restart if needed)
        audio.addEventListener("ended", () => {
          if (audio.loop && isMounted) {
            audio.currentTime = 0;
            audio.play().catch((e) => {
              // Ignore autoplay errors
              if (e.name !== "NotAllowedError") {
                console.error(e);
              }
            });
          }
        });

        // Handle errors
        audio.addEventListener("error", (e) => {
          console.error("Error loading story music:", e);
        });

        audioRef.current = audio;
      } catch (error) {
        console.error("Error initializing story audio:", error);
      }
    }

    void initializeAudio();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clean up object URL if created
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [audioPath]);

  // Play pending requests when audio is loaded
  useEffect(() => {
    if (isLoaded && pendingPlay && audioRef.current) {
      setPendingPlay(false);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          if (err.name !== "NotAllowedError") {
            console.error("Error playing story music:", err);
          }
        });
    }
  }, [isLoaded, pendingPlay]);

  const play = () => {
    if (!audioRef.current) return;
    
    // Don't play if already playing
    if (isPlaying) return;

    if (!isLoaded) {
      // Queue the play for when audio is loaded
      setPendingPlay(true);
      return;
    }

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        if (err.name !== "NotAllowedError") {
          console.error("Error playing story music:", err);
        }
      });
  };

  const pause = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setPendingPlay(false); // Cancel any pending play
    setIsPlaying(false);
    localStorage.setItem(STORY_MUSIC_PREF_KEY, "false");
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, volume));
  };

  return {
    isPlaying,
    isLoaded,
    play,
    pause,
    toggle,
    setVolume,
  };
}

/**
 * Clear story audio cache (useful for debugging or forcing refresh)
 */
export async function clearStoryAudioCache(): Promise<void> {
  if (!("caches" in window)) return;

  try {
    const deleted = await caches.delete(CACHE_NAME);
    if (deleted) {
      console.log("🗑️ Story audio cache cleared");
    }
  } catch (error) {
    console.error("Error clearing story audio cache:", error);
  }
}