"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cleanTextForSpeech } from "@/lib/utils/language-detect";

const STORAGE_KEY = "falastin_kids_voice_enabled";

interface UseVoiceSynthesisOptions {
  soundEnabled: boolean;
}

export function useVoiceSynthesis({ soundEnabled }: UseVoiceSynthesisOptions) {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  // Audio element ref for stop/cancel
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  // Generation counter to prevent race conditions with rapid messages
  const generationRef = useRef(0);

  // Persist voiceEnabled
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(voiceEnabled));
    }
  }, [voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsSpeaking(false);
    setCurrentMessageId(null);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) {
        stopAudio();
      }
      return !prev;
    });
  }, [stopAudio]);

  const stop = useCallback(() => {
    generationRef.current++;
    stopAudio();
  }, [stopAudio]);

  const speak = useCallback(
    async (text: string, messageId?: string) => {
      // Stop any current playback
      stopAudio();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const gen = ++generationRef.current;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleaned }),
        });

        if (gen !== generationRef.current) return;

        if (!res.ok) return;

        const blob = await res.blob();
        if (gen !== generationRef.current) return;

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(true);
          setCurrentMessageId(messageId ?? null);
        };

        audio.onended = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          setCurrentMessageId(null);
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          audioRef.current = null;
        };

        audio.onerror = () => {
          if (gen !== generationRef.current) return;
          setIsSpeaking(false);
          setCurrentMessageId(null);
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          audioRef.current = null;
        };

        audio.play();
      } catch {
        if (gen !== generationRef.current) return;
        setIsSpeaking(false);
        setCurrentMessageId(null);
      }
    },
    [stopAudio]
  );

  const autoReadMessage = useCallback(
    (msg: { id: string; content: string; role: string }) => {
      if (!voiceEnabled || !soundEnabled) return;
      if (msg.role !== "assistant" || !msg.content) return;
      speak(msg.content, msg.id);
    },
    [voiceEnabled, soundEnabled, speak]
  );

  const speakMessage = useCallback(
    (msg: { id: string; content: string }) => {
      speak(msg.content, msg.id);
    },
    [speak]
  );

  return {
    voiceEnabled,
    isSpeaking,
    isSupported: true,
    currentMessageId,
    toggleVoice,
    speak,
    stop,
    autoReadMessage,
    speakMessage,
  };
}
