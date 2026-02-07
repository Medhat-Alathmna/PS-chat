"use client";

import { useState, useCallback, useEffect } from "react";
import { SoundType } from "@/lib/types";
import {
  playSound as playSoundGenerator,
  resumeAudioContext,
} from "@/lib/utils/sound-generator";

const STORAGE_KEY = "falastin_kids_sound_enabled";

/**
 * Custom hook for managing sound effects in kids app
 * Uses Web Audio API for programmatic sounds - no files needed!
 */
export function useSounds() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setSoundEnabled(stored === "true");
      }
    }
  }, []);

  // Save sound preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(soundEnabled));
    }
  }, [soundEnabled]);

  // Resume audio context on first user interaction (autoplay policy)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resumeAudio = () => {
      resumeAudioContext();
    };

    // Resume on first click/touch
    document.addEventListener("click", resumeAudio, { once: true });
    document.addEventListener("touchstart", resumeAudio, { once: true });

    return () => {
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  // Play a sound
  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;

      try {
        playSoundGenerator(type);
      } catch (error) {
        console.warn(`[useSounds] Error playing sound: ${type}`, error);
      }
    },
    [soundEnabled]
  );

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Convenience methods for common sounds
  const playPop = useCallback(() => playSound("pop"), [playSound]);
  const playDing = useCallback(() => playSound("ding"), [playSound]);
  const playCoin = useCallback(() => playSound("coin"), [playSound]);
  const playSuccess = useCallback(() => playSound("success"), [playSound]);
  const playFanfare = useCallback(() => playSound("fanfare"), [playSound]);
  const playClick = useCallback(() => playSound("click"), [playSound]);

  return {
    // State
    soundEnabled,

    // Actions
    playSound,
    toggleSound,
    setSoundEnabled,

    // Convenience methods
    playPop,
    playDing,
    playCoin,
    playSuccess,
    playFanfare,
    playClick,
  };
}
