/**
 * Browser SpeechSynthesis helpers for kid-friendly TTS
 */

/**
 * Check if the browser supports SpeechSynthesis
 */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Find the best available voice for a given language.
 * Prefers voices with the exact locale match, then falls back to language prefix.
 */
export function findBestVoice(lang: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Exact locale match (e.g. "ar-SA")
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;

  // Language prefix match (e.g. "ar")
  const prefix = lang.split("-")[0];
  const prefixMatch = voices.find((v) => v.lang.startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // For Arabic, try any Arabic voice
  if (prefix === "ar") {
    const anyArabic = voices.find((v) => v.lang.startsWith("ar"));
    if (anyArabic) return anyArabic;
  }

  return null;
}

/**
 * Create a kid-friendly utterance with slower rate and slightly higher pitch
 */
export function createUtterance(
  text: string,
  lang: string
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85; // Slower for kids
  utterance.pitch = 1.1; // Slightly higher for friendlier tone

  const voice = findBestVoice(lang);
  if (voice) {
    utterance.voice = voice;
  }

  return utterance;
}

/**
 * Cancel any ongoing speech
 */
export function cancelSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
