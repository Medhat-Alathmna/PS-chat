/**
 * Age adaptation — Optimized for City Explorer
 * 
 * Controls: response length, vocabulary, emojis, options count, hint style
 * Integrated with difficulty for comprehensive adaptation
 */

export interface AgeSettings {
  maxSentences: number;
  maxWords: number;
  maxOptions: number;
  hintStyle: "obvious" | "moderate" | "subtle";
  imageStyle: "cartoon" | "colorful" | "photo";
  vocabulary: "simple" | "moderate" | "rich";
  emojiDensity: "high" | "medium" | "low";
}

/**
 * Get age-based settings
 */
export function getAgeSettings(age: number): AgeSettings {
  if (age <= 5) {
    return {
      maxSentences: 2,
      maxWords: 15,
      maxOptions: 2,
      hintStyle: "obvious",
      imageStyle: "cartoon",
      vocabulary: "simple",
      emojiDensity: "high",
    };
  }
  if (age <= 7) {
    return {
      maxSentences: 2,
      maxWords: 20,
      maxOptions: 2,
      hintStyle: "obvious",
      imageStyle: "colorful",
      vocabulary: "simple",
      emojiDensity: "high",
    };
  }
  if (age <= 9) {
    return {
      maxSentences: 3,
      maxWords: 30,
      maxOptions: 3,
      hintStyle: "moderate",
      imageStyle: "colorful",
      vocabulary: "moderate",
      emojiDensity: "medium",
    };
  }
  return {
    maxSentences: 4,
    maxWords: 50,
    maxOptions: 4,
    hintStyle: "subtle",
    imageStyle: "photo",
    vocabulary: "rich",
    emojiDensity: "low",
  };
}

/**
 * Build compact age adaptation section
 */
export function buildAgeAdaptationSection(age: number, difficulty?: string): string {
  const settings = getAgeSettings(age);
  
  // Age group label
  const group = age <= 5 ? "Preschool 👶" : age <= 7 ? "Young 🧒" : age <= 9 ? "Child 🧒" : "Pre-teen 🧑";
  
  // Vocabulary guidance
  const vocabGuide = {
    simple: "Simple words only (بحر، أكل، شجرة). No abstract concepts.",
    moderate: "Everyday words. Can mention simple history.",
    rich: "Rich vocabulary. Can use historical context.",
  };
  
  // Hint guidance
  const hintGuide = {
    obvious: "Hints: OBVIOUS (colors, shapes, food, animals). Give away gently.",
    moderate: "Hints: Start general, then specific (region → landmark → food).",
    subtle: "Hints: Make them think! Reference geography, history, culture.",
  };

  return `## Age: ${age}y (${group})
- Max ${settings.maxSentences} sentences (${settings.maxWords} words)
- ${vocabGuide[settings.vocabulary]}
- ${hintGuide[settings.hintStyle]}
- Emojis: ${settings.emojiDensity === "high" ? "2-3 per message" : settings.emojiDensity === "medium" ? "1-2 per message" : "1 per message"}
- Options: ${settings.maxOptions} max${difficulty ? ` (${difficulty}: ${difficulty === "easy" ? settings.maxOptions - 1 : difficulty === "hard" ? settings.maxOptions : settings.maxOptions})` : ""}`;
}