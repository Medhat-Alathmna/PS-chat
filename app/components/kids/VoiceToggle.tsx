"use client";

interface VoiceToggleProps {
  voiceEnabled: boolean;
  onToggle: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

/**
 * Toggle button for voice auto-read (TTS)
 * Matches existing sound toggle style (w-10 h-10 rounded-xl)
 */
export default function VoiceToggle({
  voiceEnabled,
  onToggle,
  isSpeaking,
  isSupported,
}: VoiceToggleProps) {
  if (!isSupported) return null;

  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-xl hover:bg-gray-200 active:scale-95 transition-all"
      aria-label={voiceEnabled ? "إيقاف القراءة الصوتية" : "تفعيل القراءة الصوتية"}
      role="switch"
      aria-checked={voiceEnabled}
    >
      {voiceEnabled ? "🗣️" : "🤫"}

      {/* Green pulse dot when actively speaking */}
      {isSpeaking && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--kids-green)] rounded-full animate-pulse" />
      )}
    </button>
  );
}
