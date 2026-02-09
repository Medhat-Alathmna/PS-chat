"use client";

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  onToggle: () => void;
}

/**
 * Small speaker/waveform button shown at bottom-left of assistant bubbles.
 * Click toggles speak/stop for that specific message.
 */
export default function SpeakingIndicator({ isSpeaking, onToggle }: SpeakingIndicatorProps) {
  return (
    <button
      onClick={onToggle}
      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm hover:scale-110 active:scale-95 transition-transform"
      aria-label={isSpeaking ? "إيقاف القراءة" : "اقرأ الرسالة"}
    >
      {isSpeaking ? (
        <div className="flex items-center gap-0.5">
          <span className="w-0.5 h-3 bg-[var(--kids-purple)] rounded-full animate-wave-bar" />
          <span className="w-0.5 h-3 bg-[var(--kids-purple)] rounded-full animate-wave-bar" style={{ animationDelay: "0.15s" }} />
          <span className="w-0.5 h-3 bg-[var(--kids-purple)] rounded-full animate-wave-bar" style={{ animationDelay: "0.3s" }} />
        </div>
      ) : (
        "🔈"
      )}
    </button>
  );
}
