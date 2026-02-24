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
    <div className="shrink-0 p-2 sm:p-3 z-20">
      {/* Image preview */}
      {imagePreview && (
        <div className="mx-auto max-w-2xl mb-3 animate-fade-in-up">
          <div className="relative inline-block group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview.url}
              alt="معاينة الصورة"
              className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform duration-300"
            />
            <button
              onClick={onClearImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:scale-110 active:scale-95 transition-transform border-2 border-white"
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
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageSelect}
        />

        <div className={`flex items-end gap-3 sm:gap-4 rounded-[2rem] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all focus-within:shadow-[0_12px_48px_rgba(108,92,231,0.25)] focus-within:ring-4 focus-within:ring-[var(--kids-purple)]/20 border-2 border-white p-3 sm:p-4 ${hasActiveChips ? "opacity-90 grayscale-[0.5]" : ""}`}>

          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-50 text-[var(--kids-purple)] transition-all hover:from-purple-200 hover:to-purple-100 hover:scale-110 active:scale-90 disabled:opacity-40 shadow-md"
            aria-label="إرفاق صورة"
          >
            <span className="text-2xl sm:text-3xl">📷</span>
          </button>

          <div className="flex-1 min-w-0 py-3 sm:py-4">
            <textarea
              ref={textareaRef}
              className="w-full max-h-[140px] resize-none bg-transparent text-lg sm:text-xl text-gray-800 placeholder:text-gray-500 focus:outline-none leading-relaxed px-2 font-medium"
              placeholder="اسأل مدحت..."
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={500}
              disabled={isLoading}
              dir="auto"
              style={{
                minHeight: '32px',
              }}
            />
          </div>

          {/* Mic button for speech input */}
          <div className="shrink-0">
            <SpeechInput
              onTranscript={(text) => onInputChange(input ? input + " " + text : text)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="group relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--kids-green)] to-emerald-400 text-white shadow-lg shadow-emerald-500/40 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/60 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:grayscale disabled:cursor-not-allowed"
            aria-label="إرسال"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-2xl sm:text-3xl transform -translate-x-0.5 group-active:translate-x-2 group-active:-translate-y-2 transition-transform duration-200">🚀</span>
                {canSend && (
                  <span className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-110 group-active:opacity-0 transition-all duration-300"></span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Helper text or mascot placement */}
        <div className="flex justify-center mt-3 h-8">
          <AnimatedMascot
            state={isSpeaking ? "speaking" : isLoading ? "thinking" : "idle"}
            size="sm"
            className={`transition-all duration-300 ${isLoading || isSpeaking ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          />
        </div>
      </form>
    </div>
  );
}