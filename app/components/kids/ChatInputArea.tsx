"use client";

import { RefObject, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import AnimatedMascot from "./AnimatedMascot";
import SpeechInput from "./SpeechInput";

/**
 * Props for the ChatInputArea component
 */
interface ChatInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => Promise<void>;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isSpeaking: boolean;
  canSend: boolean;
  hasActiveChips: boolean;
  imagePreview: { url: string; mediaType: string; file: File } | null;
  onClearImage: () => void;
  onImageSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Chat input area component.
 * Renders image preview, input form with camera, textarea, mic, and send button.
 */
export default function ChatInputArea({
  input,
  onInputChange,
  onSubmit,
  onKeyDown,
  isLoading,
  isSpeaking,
  canSend,
  hasActiveChips,
  imagePreview,
  onClearImage,
  onImageSelect,
  textareaRef,
  fileInputRef,
}: ChatInputAreaProps) {
  return (
    <div className="shrink-0 p-3 sm:p-4 z-20">
      {/* Image preview */}
      {imagePreview && (
        <div className="mx-auto max-w-2xl mb-3 animate-fade-in-up">
          <div className="relative inline-block group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview.url}
              alt="معاينة الصورة"
              className="h-24 w-24 object-cover rounded-2xl border-4 border-[var(--kids-purple)]/30 shadow-[0_0_20px_rgba(165,94,234,0.25)] rotate-2 group-hover:rotate-0 transition-transform duration-300"
            />
            <button
              onClick={onClearImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg hover:scale-110 active:scale-90 transition-transform duration-150 border-2 border-white"
              aria-label="إزالة الصورة"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="mx-auto max-w-2xl"
      >
        {/* Mobile layout: WhatsApp-style row */}
        <div className={`flex items-end gap-2 ${hasActiveChips ? "opacity-60 pointer-events-none" : ""}`}>

          {/* Camera button — mobile only (sm:hidden) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="sm:hidden shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-white/85 backdrop-blur-md border border-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.10)] text-[var(--kids-purple)] text-xl transition-all active:scale-90 disabled:opacity-40 touch-manipulation"
            aria-label="إرفاق صورة"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onImageSelect}
            className="hidden"
          />

          {/* Input pill */}
          <div className={`relative flex-1 flex items-end gap-2 sm:gap-3 rounded-[2rem] bg-white/85 backdrop-blur-md transition-all duration-300 focus-within:shadow-[0_8px_40px_rgba(165,94,234,0.28)] focus-within:bg-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-white/60 focus-within:border-[var(--kids-purple)]/30 px-3 py-2 sm:px-4 sm:py-3`}>

            {/* Inner shimmer */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white to-transparent rounded-full pointer-events-none" />

            {/* Camera button — desktop only (hidden on mobile) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="hidden sm:flex shrink-0 h-9 w-9 items-center justify-center rounded-full text-[var(--kids-purple)] text-lg transition-all hover:bg-[var(--kids-purple)]/10 active:scale-90 disabled:opacity-40 mb-1"
              aria-label="إرفاق صورة"
            >
              📷
            </button>

            <div className="flex-1 min-w-0 py-1">
              <textarea
                ref={textareaRef}
                className="w-full max-h-[140px] resize-none bg-transparent text-lg sm:text-xl text-gray-800 placeholder:text-gray-400/80 focus:outline-none leading-relaxed font-medium"
                placeholder="اسأل مدحت..."
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={500}
                disabled={isLoading}
                dir="auto"
                style={{ minHeight: '40px' }}
              />
            </div>

            {/* Mic — desktop always visible; mobile only when no input */}
            <div className={`shrink-0 mb-0.5 transition-all duration-200 ${input.trim() ? "hidden sm:block" : "block"}`}>
              <SpeechInput
                onTranscript={(text) => onInputChange(input ? input + " " + text : text)}
                disabled={isLoading}
              />
            </div>

            {/* Send — desktop always; mobile only when has input */}
            <button
              type="submit"
              disabled={!canSend}
              className={`group relative flex h-11 w-11 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-300 text-white transition-all duration-200 touch-manipulation animate-glow-pulse hover:scale-110 hover:from-emerald-400 hover:to-teal-300 active:scale-90 disabled:opacity-40 disabled:shadow-none disabled:grayscale disabled:cursor-not-allowed disabled:[animation:none] ${!input.trim() ? "hidden sm:flex" : "flex"}`}
              aria-label="إرسال"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl sm:text-2xl group-active:translate-x-1 group-active:-translate-y-1 transition-transform duration-150">🚀</span>
                  {canSend && (
                    <span className="absolute inset-0 rounded-full bg-white/25 scale-0 group-active:scale-110 group-active:opacity-0 transition-all duration-200" />
                  )}
                </>
              )}
            </button>
          </div>

          {/* Mobile send — shown outside pill when typing, replaces camera slot */}
          <button
            type="submit"
            disabled={!canSend}
            className={`sm:hidden shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-300 text-white shadow-[0_4px_16px_rgba(78,205,196,0.45)] transition-all duration-200 touch-manipulation active:scale-90 disabled:opacity-40 disabled:grayscale ${input.trim() ? "flex" : "hidden"}`}
            aria-label="إرسال"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-xl">🚀</span>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}