/**
 * City Explorer — Optimized game module (Token-Efficient)
 *
 * Key optimizations:
 * 1. DRY principle - no repeated rules
 * 2. Minimal examples - only essential ones
 * 3. State machine approach - clear transitions
 * 4. Static content FIRST for prompt caching (OpenAI 50% discount on cached prefix)
 * 5. Critical checklist at END (recency bias)
 */

import { CITIES, REGIONS, City } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_CHARACTER as MEDHAT_BASE,
  SAFETY_RULES,
} from "../../kids";
import { buildAgeAdaptationSection } from "./age";
import {
  advanceRoundTool,
  endGameTool,
} from "../../game-tools";
import { imageSearchTool } from "../../tools";

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
  // Take first landmark phrase only (before و) to keep query focused
  const primaryLandmark = city.famousFor.landmark.split(" و")[0].trim();
  return `${primaryLandmark} ${city.name} Palestine`;
}

// ── Opt-in: trim completed-round messages server-side ────────────────
export const trimCompletedRounds = true;

// ── Tool collection ──────────────────────────────────────────────────

/**
 * Build game tools — only advance_round, end_game, image_search.
 * Options/hints are now delivered via GAME_TURN JSON suffix injected server-side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTools(): Record<string, any> {
  return {
    advance_round: advanceRoundTool,
    end_game: endGameTool,
    image_search: imageSearchTool,
  };
}

// ── Core Rules ────────────────────────────────────────────────────────

const CORE_RULES = `## Game: City Explorer

### Response Format (MANDATORY):
Every response MUST end with this JSON on its own line:
GAME_TURN:{"options":["مدينة أ","مدينة ب","مدينة ج"]}

Exception: end_game responses do NOT need GAME_TURN.

### Flow:
- NEW QUESTION: Write riddle (2-3 sentences) → append GAME_TURN with current city options
- WRONG ANSWER: Write encouragement (1 sentence) → REPEAT THE RIDDLE again (1-2 sentences using same clues) → append GAME_TURN with EXACT SAME options
- CORRECT ANSWER — STRICT ORDER:
  1. Write celebration (1 sentence ONLY)
  2. Append GAME_TURN with a few city name options (include the next round's city somewhere in the list)
  3. Call advance_round tool — MUST be LAST, after GAME_TURN. After it returns: output NOTHING.
  ⚠ DO NOT write the next city's riddle here — it will be written automatically in the next message
  ⚠ WRONG: celebration → advance_round → riddle → GAME_TURN (tool before text = duplicate content bug)
- OFF-TOPIC: Reply in 1-2 sentences → append GAME_TURN with CURRENT options. NEVER leave player without options!

### Critical Rules:
- STRICT: Use ONLY facts from City Data. Never invent or embellish facts.
- GAME_TURN options MUST include the correct city answer
- NEVER mention coordinates/lat/lng
- NEVER call check_answer, or present_options — they do not exist`;

// ── Tool Quick Reference ─────────────────────────────────────────────

const TOOL_REFERENCE = `## Tools:
- advance_round({roundCompleted, feedback, pointsEarned: 15}) — call ONLY on correct answer
- end_game — call when all rounds complete or player quits
- image_search — optional, for extra visuals`;

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

// ── System Prompt Builder (Optimized) ────────────────────────────────


export function buildSystemPrompt(
  age: number,
  currentCity: City,
  nextCityName: string,
  isReviewMode: boolean = false,
  playerName?: string,
  chatContext?: KidsChatContext,
  confirmedCorrect?: boolean,
): string {
  const regionInfo = REGIONS[currentCity.region];

  const parts: string[] = [
    // ── STATIC PREFIX (cacheable ~1200-1500 tokens) ──────────────────

    // 1. Character (static)
    MEDHAT_BASE,

    // 2. Core rules (static)
    CORE_RULES,

    // 3. Safety (static)
    SAFETY_RULES,

    // 4. Tool reference (static)
    TOOL_REFERENCE,

    // 5. Game info (static)
    `## Game: مستكشف المدن | Rounds: 5 | Points: 15/correct | Bonus: 25`,

    // ── SEMI-STATIC / DYNAMIC (changes per session/round) ────────────

    // 6. Age adaptation (semi-static — per session)
    buildAgeAdaptationSection(age),

    // 7. Player name (semi-static — per session)
    playerName ? `## Player: ${playerName}\nUse their name naturally every 2–3 messages — not every sentence.` : "",

    // 9. Chat context (dynamic)
    chatContext?.recentTopics?.length
      ? `## Context: Player was talking about ${chatContext.recentTopics.join(", ")}`
      : "",

    // 10. Target city (dynamic — changes per round)
    `⚠️ TARGET CITY: ${currentCity.nameAr} | Region: ${regionInfo.nameAr}`,

    // 11. City data current (dynamic)
    formatCityData(currentCity, isReviewMode),

    // 12. CRITICAL REMINDER at END (LLM pays attention to end)
    `⚠️ CHECKLIST before responding:
✅ Every response ends with GAME_TURN:{"options":[...]} (except end_game)
✅ Current question: GAME_TURN options include "${currentCity.nameAr}"
✅ Correct answer? → celebration (1 sentence) + GAME_TURN (include "${nextCityName}" in options) + advance_round. NO riddle here.
✅ Wrong answer? → encouragement + REPEAT riddle clues (from City Data above) + GAME_TURN with SAME options (${currentCity.nameAr} still in list)
✅ Off-topic? → 1-2 sentence reply + GAME_TURN with current options
✅ Riddle uses ONLY facts from "## City Data" above — NEVER invent clues`,

    // 13. Server-confirmed correct answer override (injected only when match detected)
    confirmedCorrect
      ? `🚨 OVERRIDE — SERVER CONFIRMED CORRECT ANSWER:
The server has verified that the player's last answer EXACTLY matches "${currentCity.nameAr}".
You MUST call advance_round immediately. Do NOT say the answer is wrong. Do NOT repeat the riddle.`
      : "",
  ];

  return parts.filter(Boolean).join("\n\n");
}