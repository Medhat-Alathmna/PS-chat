"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isSpeechSupported, createUtterance, cancelSpeech } from "@/lib/utils/speech-synthesis";
import { detectLanguage, getVoiceLang, cleanTextForSpeech } from "@/lib/utils/language-detect";

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
  const [isSupported, setIsSupported] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  // Generation counter to prevent race conditions with rapid messages
  const generationRef = useRef(0);

  // Check support & load voices
  useEffect(() => {
    const supported = isSpeechSupported();
    setIsSupported(supported);

    if (supported) {
      // Chrome loads voices asynchronously
      const handleVoicesChanged = () => {
        // Voices loaded — no action needed, findBestVoice reads them on demand
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        // Cancel orphaned speech on unmount (Safari fix)
        cancelSpeech();
      };
    }
  }, []);

  // Persist voiceEnabled
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(voiceEnabled));
    }
  }, [voiceEnabled]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) {
        // Turning off — stop current speech
        cancelSpeech();
        setIsSpeaking(false);
        setCurrentMessageId(null);
      }
      return !prev;
    });
  }, []);

  const stop = useCallback(() => {
    cancelSpeech();
    setIsSpeaking(false);
    setCurrentMessageId(null);
  }, []);

  const speak = useCallback(
    (text: string, messageId?: string) => {
      if (!isSupported) return;

      // Cancel any current speech
      cancelSpeech();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        return;
      }

      const lang = detectLanguage(cleaned);
      const voiceLang = getVoiceLang(lang);
      const utterance = createUtterance(cleaned, voiceLang);
      const gen = ++generationRef.current;

      utterance.onstart = () => {
        if (generationRef.current !== gen) return;
        setIsSpeaking(true);
        setCurrentMessageId(messageId ?? null);
      };

      utterance.onend = () => {
        if (generationRef.current !== gen) return;
        setIsSpeaking(false);
        setCurrentMessageId(null);
      };

      utterance.onerror = () => {
        if (generationRef.current !== gen) return;
        setIsSpeaking(false);
        setCurrentMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  /**
   * Auto-read a new assistant message (respects voiceEnabled + soundEnabled)
   */
  const autoReadMessage = useCallback(
    (msg: { id: string; content: string; role: string }) => {
      if (!voiceEnabled || !soundEnabled || !isSupported) return;
      if (msg.role !== "assistant" || !msg.content) return;
      speak(msg.content, msg.id);
    },
    [voiceEnabled, soundEnabled, isSupported, speak]
  );

  /**
   * Manual replay of a specific message (ignores voiceEnabled toggle)
   */
  const speakMessage = useCallback(
    (msg: { id: string; content: string }) => {
      if (!isSupported) return;
      speak(msg.content, msg.id);
    },
    [isSupported, speak]
  );

  return {
    voiceEnabled,
    isSpeaking,
    isSupported,
    currentMessageId,
    toggleVoice,
    speak,
    stop,
    autoReadMessage,
    speakMessage,
  };
}
