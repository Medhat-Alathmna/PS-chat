"use client";

import { RefObject, FormEvent, KeyboardEvent } from "react";
import SpeechInput from "./SpeechInput";

interface ChatInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => Promise<void>;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isSpeaking: boolean;
  canSend: boolean;
  hasActiveChips: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInputArea({
  input,
  onInputChange,
  onSubmit,
  onKeyDown,
  isLoading,
  canSend,
  textareaRef,
}: ChatInputAreaProps) {
  const hasInput = input.trim().length > 0;

  return (
    <div
      className="shrink-0 px-3 py-2"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-2xl">
        <div
          className={`flex items-end gap-2 transition-opacity ${
            ""
          }`}
        >
          {/* Input pill */}
          <div className="relative flex-1 flex items-end rounded-3xl bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-sm px-4 py-2 min-h-[46px]">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            <textarea
              ref={textareaRef}
              className="flex-1 w-full max-h-[120px] resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 outline-none ring-0 leading-relaxed"
              placeholder="اسأل مدحت..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={500}
              disabled={isLoading}
              dir="auto"
              style={{ minHeight: "26px", outline: "none" }}
            />
          </div>

          {/* Action button: send when typing, mic when idle */}
          {hasInput || isLoading ? (
            <button
              type="submit"
              disabled={!canSend}
              className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-300 text-white shadow-md transition-all active:scale-90 disabled:opacity-40 disabled:grayscale touch-manipulation"
              aria-label="إرسال"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-lg">🚀</span>
              )}
            </button>
          ) : (
            <SpeechInput
              onTranscript={(text) =>
                onInputChange(input ? input + " " + text : text)
              }
              disabled={isLoading}
              className="h-11 w-11 text-lg"
            />
          )}
        </div>
      </form>
    </div>
  );
}
