"use client";

import { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  playerAge?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-permission": "يرجى السماح بالميكروفون",
  "no-speech": "لم يتم التقاط صوت",
  "audio-capture": "مشكلة في الميكروفون",
  "network": "مشكلة في الشبكة",
};

/**
 * Mic input button for speech-to-text
 */
export default function SpeechInput({ onTranscript, disabled, className, playerAge }: SpeechInputProps) {
  const isYoungKid = playerAge !== undefined && playerAge <= 7;
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

  const defaultSize = isYoungKid
    ? "h-14 w-14 text-2xl"
    : "h-10 w-10 sm:h-12 sm:w-12 text-lg sm:text-xl";

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 shadow-md transform
          ${className || defaultSize}
          ${isListening
            ? "bg-red-500 text-white animate-mic-pulse"
            : isYoungKid
              ? "bg-[var(--kids-blue)] text-white ring-4 ring-blue-300/50 animate-pulse"
              : "bg-[var(--kids-blue)] text-white"
          }
        `}
        aria-label={isListening ? "إيقاف الاستماع" : "تحدث بدل الكتابة"}
      >
        {isListening ? "⏹️" : "🎤"}
      </button>
      {isYoungKid && !isListening && (
        <span className="text-[10px] font-bold text-[var(--kids-blue)] mt-0.5 animate-pulse">
          احكي!
        </span>
      )}

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
