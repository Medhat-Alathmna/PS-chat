/**
 * City Explorer — Refactored game module
 *
 * Uses generateObject() + Zod schema instead of streaming + tool calls.
 * Age logic removed. GAME_TURN suffix hacks removed.
 */

import { z } from "zod";
import { CITIES, REGIONS, City } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_CHARACTER as MEDHAT_BASE,
  SAFETY_RULES,
} from "../../kids";

// ── Arabic text normalization ─────────────────────────────────────────

/**
 * Normalize Arabic text for comparison — strips diacritics and normalizes
 * common character variants (alef, taa marbuta, alef maqsura).
 */
export function normalizeArabic(text: string): string {
  return text
    .trim()
    .replace(/[\u064B-\u065F]/g, "") // strip tashkeel (diacritics)
    .replace(/[أإآ]/g, "ا")          // normalize alef variants
    .replace(/ة/g, "ه")              // normalize taa marbuta
    .replace(/ى/g, "ي");             // normalize alef maqsura
}

// ── Zod Schema ────────────────────────────────────────────────────────

export const GameResponseSchema = z.object({
  type: z.enum(["turn", "game_over"]).describe('"turn" for an ongoing game round, "game_over" when all 5 rounds are completed or the player quits'),
  message: z.string().describe("Medhat's Arabic message — riddle, encouragement, celebration, or farewell"),
  options: z.array(z.string()).optional().describe("Exactly 3 Arabic city name options including the correct answer (required when type=turn)"),
  reason: z.enum(["completed", "quit"]).optional().describe("Why the game ended (required when type=game_over)"),
});

export type GameResponse = z.infer<typeof GameResponseSchema>;

// ── Pre-computed hint (server-side, no LLM needed) ──────────────────

export interface PrecomputedHint {
  hint: string;
  images: ImageResult[];
  targetCityId: string;
  pointsDeduction: number;
}

/**
 * Build a hint from city data — deterministic, no LLM call needed.
 * Picks the 2nd fact (index 1) to avoid overlap with the riddle.
 */
export function buildPrecomputedHint(
  city: City,
  images: ImageResult[]
): PrecomputedHint {
  const hintIndex = city.facts.length > 1 ? 1 : 0;
  return {
    hint: city.facts[hintIndex],
    images,
    targetCityId: city.id,
    pointsDeduction: 0,
  };
}

/**
 * Build an image search query from city landmark data.
 * Use English name + Palestine for more accurate image search results.
 */
export function buildHintImageQuery(city: City): string {
  const primaryLandmark = city.famousFor.landmark.split(" و")[0].trim();
  return `${primaryLandmark} ${city.name} Palestine`;
}

// ── City Selection System (Random + Region Diverse) ──────────────────

const REGION_PRIORITY = [
  "west-bank",
  "galilee",
  "coast",
  "gaza",
  "interior",
  "negev",
] as const;

/**
 * Pick a random city, preferring regions not yet visited for diversity.
 */
export function getCityForRound(
  excludeIds?: string[]
): { city: City; isReviewMode: boolean } {
  const pool = excludeIds?.length
    ? CITIES.filter((c) => !excludeIds.includes(c.id))
    : CITIES;

  const isReviewMode = pool.length === 0;
  if (isReviewMode) {
    return { city: CITIES[Math.floor(Math.random() * CITIES.length)], isReviewMode };
  }

  const usedRegions = excludeIds
    ? CITIES.filter((c) => excludeIds.includes(c.id)).map((c) => c.region)
    : [];

  for (const region of REGION_PRIORITY) {
    if (!usedRegions.includes(region)) {
      const regionCities = pool.filter((c) => c.region === region);
      if (regionCities.length > 0) {
        return { city: regionCities[Math.floor(Math.random() * regionCities.length)], isReviewMode: false };
      }
    }
  }

  return { city: pool[Math.floor(Math.random() * pool.length)], isReviewMode: false };
}

/**
 * Format city data - COMPACT format
 */
function formatCityData(city: City, isReviewMode: boolean): string {
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.map((f, i) => `${i + 1}. ${f}`).join(" | ");

  const header = isReviewMode
    ? `## City Data (REVIEW - all discovered! 🎉)`
    : `## City Data`;

  return `${header}

🎯 ANSWER: ${city.nameAr} (${city.name})
📍 Region: ${regionInfo.nameAr}

📝 Facts (use for hints):
${facts}

📖 Description: ${city.descriptionAr}

🍽️ Food: ${city.famousFor.food}
🏛️ Landmark: ${city.famousFor.landmark}
🎨 Craft: ${city.famousFor.craft}
🏖️ Lifestyle: ${city.lifestyle.join(" | ")}`;
}

/**
 * Compact next-city section — only what the AI needs to write the riddle/hint/options
 */
function formatNextCityData(city: City): string {
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.slice(0, 3).map((f, i) => `${i + 1}. ${f}`).join(" | ");
  return `## Next City Data (use AFTER correct answer)
🎯 NEXT ANSWER: ${city.nameAr} (${city.name})
📍 Region: ${regionInfo.nameAr}
📝 Facts: ${facts}
🍽️ Food: ${city.famousFor.food} | 🏛️ Landmark: ${city.famousFor.landmark}
📖 ${city.descriptionAr}`;
}

// ── Core Rules ────────────────────────────────────────────────────────

const CORE_RULES = `## Game: City Explorer

### Response Rules:
- NEW QUESTION: Write riddle (2-3 sentences using facts) → set options with 3 cities including correct answer
- WRONG ANSWER: Encouragement (1 sentence) → repeat riddle (1-2 sentences, same clues) → SAME 3 options
- CORRECT ANSWER: Celebration (1 sentence) → new riddle for NEXT CITY (2-3 sentences) → next city options
- OFF-TOPIC: 1-2 sentence reply → current city options. NEVER leave player without options!
- GAME OVER (5 rounds done or player quits): use type="game_over"

### Critical Rules:
- Use ONLY facts from City Data. Never invent or embellish facts.
- options MUST include the correct city answer
- NEVER mention coordinates/lat/lng`;

// ── System Prompt Builder ─────────────────────────────────────────────

export function buildSystemPrompt(
  currentCity: City,
  nextCity: City,
  isReviewMode: boolean = false,
  playerName?: string,
  chatContext?: KidsChatContext,
  confirmedCorrect?: boolean,
): string {
  const regionInfo = REGIONS[currentCity.region];

  const parts: string[] = [
    // 1. Character (static)
    MEDHAT_BASE,

    // 2. Core rules (static)
    CORE_RULES,

    // 3. Safety (static)
    SAFETY_RULES,

    // 4. Game info (static)
    `## Game: مستكشف المدن | Rounds: 5 | Points: 15/correct | Bonus: 25`,

    // 5. Player name (semi-static)
    playerName ? `## Player: ${playerName}\nUse their name naturally every 2–3 messages — not every sentence.` : "",

    // 6. Chat context (dynamic)
    chatContext?.recentTopics?.length
      ? `## Context: Player was talking about ${chatContext.recentTopics.join(", ")}`
      : "",

    // 7. Target city (dynamic)
    `⚠️ TARGET CITY: ${currentCity.nameAr} | Region: ${regionInfo.nameAr} | NEXT: ${nextCity.nameAr}`,

    // 8. City data current (dynamic)
    formatCityData(currentCity, isReviewMode),

    // 9. Next city data (dynamic)
    formatNextCityData(nextCity),

    // 10. CRITICAL REMINDER at END
    `⚠️ CHECKLIST before responding:
✅ message: Medhat's response in Arabic (riddle / encouragement / celebration)
✅ options: exactly 3 cities, must include "${currentCity.nameAr}" (or "${nextCity.nameAr}" after correct answer)
✅ Wrong answer? → repeat riddle clues, SAME options with "${currentCity.nameAr}" still in list
✅ Correct answer? → celebration + new riddle for ${nextCity.nameAr}, options include "${nextCity.nameAr}"
✅ 5 rounds done? → type="game_over"`,

    // 11. Server-confirmed correct answer override
    confirmedCorrect
      ? `🚨 OVERRIDE — SERVER CONFIRMED CORRECT ANSWER:
The server verified the player's last answer EXACTLY matches "${currentCity.nameAr}".
Respond as CORRECT ANSWER: celebration + new riddle for next city + options for ${nextCity.nameAr}.`
      : "",
  ];

  return parts.filter(Boolean).join("\n\n");
}
