import { useEffect, useRef, useState } from "react";

const CACHE_NAME = "falastin-audio-cache-v1";

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
    console.error("Error caching audio:", error);
  }

  return audioPath;
}

/**
 * Hook for managing background music
 * Supports play/pause/loop functionality with audio file
 * Caches audio file for faster loading
 * Automatically plays on every page load
 */
export function useBackgroundMusic(audioPath: string = "/sounds/PS-chat-Backgound.ogg") {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
        audio.volume = 0.3; // Set comfortable volume (30%)
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
            audio.play().catch(console.error);
          }
        });

        // Handle errors
        audio.addEventListener("error", (e) => {
          console.error("Error loading background music:", e);
        });

        audioRef.current = audio;
      } catch (error) {
        console.error("Error initializing audio:", error);
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

  // Auto-play ALWAYS on load
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded || !audioRef.current) {
      return;
    }

    // ALWAYS try to play
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        // Auto-play blocked by browser, start on first user interaction
        setIsPlaying(false);

        const startOnInteraction = () => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(console.error);
          }
        };

        document.addEventListener("click", startOnInteraction, { once: true });
        document.addEventListener("keydown", startOnInteraction, { once: true });
        document.addEventListener("touchstart", startOnInteraction, { once: true });
      });
  }, [isLoaded]);

  const play = () => {
    if (!audioRef.current || !isLoaded) return;

    audioRef.current.play().catch((err) => {
      console.error("Error playing background music:", err);
    });
    setIsPlaying(true);
  };

  const pause = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false);
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
 * Clear audio cache (useful for debugging or forcing refresh)
 */
export async function clearAudioCache(): Promise<void> {
  if (!("caches" in window)) return;

  try {
    const deleted = await caches.delete(CACHE_NAME);
    if (deleted) {
      console.log("🗑️ Audio cache cleared");
    }
  } catch (error) {
    console.error("Error clearing audio cache:", error);
  }
}
