"use client";

import { useCallback, useEffect, useRef } from "react";

// Module-level flag: survives SPA navigation, resets on full page refresh
let mainTtsPlayed = false;

const SOUNDS = {
  mainTts: "/sounds/medhat-voice/main%20tts.ogg",
  lookAtMap: "/sounds/medhat-voice/look%20at%20the%20map.ogg",
  lookAtPics: "/sounds/medhat-voice/look%20to%20the%20pics.ogg",
} as const;

type SoundKey = keyof typeof SOUNDS;

export function useMedhatVoices({ voiceEnabled }: { voiceEnabled: boolean }) {
  const cache = useRef<Partial<Record<SoundKey, HTMLAudioElement>>>({});
  // Sync ref inline — no effect needed
  const voiceRef = useRef(voiceEnabled);
  voiceRef.current = voiceEnabled;

  // Preload all 3 sounds on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const [key, src] of Object.entries(SOUNDS) as [SoundKey, string][]) {
      const audio = new Audio(src);
      audio.preload = "auto";
      cache.current[key] = audio;
    }
    return () => {
      for (const audio of Object.values(cache.current)) {
        audio?.pause();
        if (audio) audio.src = "";
      }
      cache.current = {};
    };
  }, []);

  // Play main TTS on first user interaction per session
  useEffect(() => {
    if (typeof window === "undefined" || mainTtsPlayed) return;

    const handle = () => {
      mainTtsPlayed = true;
      if (!voiceRef.current) return;
      const audio = cache.current.mainTts;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    document.addEventListener("click", handle, { once: true });
    document.addEventListener("touchstart", handle, { once: true });
    return () => {
      document.removeEventListener("click", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  const play = useCallback((key: SoundKey) => {
    if (!voiceEnabled) return;
    const audio = cache.current[key];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [voiceEnabled]);

  const playLookAtMap = useCallback(() => play("lookAtMap"), [play]);
  const playLookAtPics = useCallback(() => play("lookAtPics"), [play]);

  return { playLookAtMap, playLookAtPics };
}
