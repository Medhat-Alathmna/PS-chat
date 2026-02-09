/**
 * Language detection and text cleaning for speech synthesis
 */

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

export type DetectedLanguage = "ar" | "en" | "mixed";

/**
 * Detect whether text is Arabic, English, or mixed
 */
export function detectLanguage(text: string): DetectedLanguage {
  const cleaned = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (cleaned.length === 0) return "ar"; // default to Arabic

  const arabicMatches = cleaned.match(ARABIC_RANGE);
  const arabicCount = arabicMatches?.length ?? 0;
  const ratio = arabicCount / cleaned.length;

  if (ratio > 0.6) return "ar";
  if (ratio < 0.2) return "en";
  return "mixed";
}

/**
 * Get BCP-47 voice language tag
 */
export function getVoiceLang(lang: DetectedLanguage): string {
  return lang === "en" ? "en-US" : "ar-SA";
}

/**
 * Strip markdown, URLs, emoji, and collapse whitespace for cleaner TTS
 */
export function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Remove markdown bold/italic
  cleaned = cleaned.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  cleaned = cleaned.replace(/_{1,3}([^_]+)_{1,3}/g, "$1");

  // Remove markdown links [text](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, "");

  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // Remove markdown list markers
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, "");
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove emoji (keep Arabic/Latin text)
  cleaned = cleaned.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
    ""
  );

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}
