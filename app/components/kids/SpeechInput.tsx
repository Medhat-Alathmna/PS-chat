"use client";

import { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-permission": "يرجى السماح بالميكروفون",
  "no-speech": "لم يتم التقاط صوت",
  "audio-capture": "مشكلة في الميكروفون",
  "network": "مشكلة في الشبكة",
};

/**
 * Mic input button for speech-to-text
 * Circular button matching send button style (h-12 w-12)
 */
export default function SpeechInput({ onTranscript, disabled }: SpeechInputProps) {
  const {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    error,
    toggleListening,
    resetTranscript,
  } = useSpeechRecognition();

  const prevFinalRef = useRef("");

  // When final transcript arrives, send it up
  useEffect(() => {
    if (finalTranscript && finalTranscript !== prevFinalRef.current) {
      prevFinalRef.current = finalTranscript;
      onTranscript(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript, onTranscript, resetTranscript]);

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          flex h-12 w-12 items-center justify-center rounded-2xl text-xl
          transition-all hover:scale-105 active:scale-95
          disabled:opacity-40 disabled:hover:scale-100 shadow-md
          ${
            isListening
              ? "bg-red-500 text-white animate-mic-pulse"
              : "bg-[var(--kids-blue)] text-white"
          }
        `}
        aria-label={isListening ? "إيقاف الاستماع" : "تحدث بدل الكتابة"}
      >
        {isListening ? "⏹️" : "🎤"}
      </button>

      {/* Interim transcript tooltip */}
      {isListening && interimTranscript && (
        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-xl px-3 py-1.5 shadow-lg text-xs text-gray-600 whitespace-nowrap max-w-48 truncate animate-fade-in border border-gray-200">
          {interimTranscript}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && !interimTranscript && (
        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-xl px-3 py-1.5 shadow-lg text-xs text-gray-500 whitespace-nowrap animate-fade-in border border-gray-200">
          جاري الاستماع...
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-50 rounded-xl px-3 py-1.5 shadow-lg text-xs text-red-600 whitespace-nowrap animate-fade-in border border-red-200">
          {ERROR_MESSAGES[error] || "حصل خطأ"}
        </div>
      )}
    </div>
  );
}
