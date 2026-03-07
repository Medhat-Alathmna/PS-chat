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
import { GameDifficulty, KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_CHARACTER as MEDHAT_BASE,
  SAFETY_RULES,
} from "../../kids";
import { buildAgeAdaptationSection, getAgeSettings } from "./age";
import {
  advanceRoundTool,
  endGameTool,
} from "../../game-tools";
import { imageSearchTool } from "../../tools";

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
  difficulty: GameDifficulty,
  images: ImageResult[]
): PrecomputedHint {
  const hintIndex = city.facts.length > 1 ? 1 : 0;
  return {
    hint: city.facts[hintIndex],
    images,
    targetCityId: city.id,
    pointsDeduction: { easy: 0, medium: 1, hard: 2 }[difficulty],
  };
}

/**
 * Build an image search query from city landmark data.
 */
export function buildHintImageQuery(city: City): string {
  return `${city.famousFor.landmark} ${city.nameAr}`;
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
- WRONG ANSWER: Write encouragement (1 sentence) → append GAME_TURN with SAME options
- CORRECT ANSWER (ONE response): Write celebration (1 sentence) → call advance_round → write riddle for NEXT CITY → append GAME_TURN with NEXT CITY options
- OFF-TOPIC: Reply in 1-2 sentences → append GAME_TURN with CURRENT options. NEVER leave player without options!

### Critical Rules:
- STRICT: Use ONLY facts from City Data. Never invent or embellish facts.
- GAME_TURN options MUST include the correct city answer
- After correct: BRIEF celebration → advance_round → next riddle → GAME_TURN (next city)
- NEVER mention coordinates/lat/lng
- NEVER call check_answer, give_hint, or present_options — they do not exist`;

// ── Tool Quick Reference ─────────────────────────────────────────────

const TOOL_REFERENCE = `## Tools:
- advance_round — call ONLY on correct answer (or "السؤال الجاي" fallback)
- end_game — call when all rounds complete or player quits
- image_search — optional, for extra visuals`;

// ── City Selection System (Smart + Region Diverse + Progressive) ────────

/**
 * City fame levels for progressive difficulty
 * Cities are ranked by how well-known they are to Palestinian children
 */
const CITY_FAME_LEVELS = {
  // Tier 1: Most famous - every Palestinian kid knows these
  famous: [
    "jerusalem", "nablus", "gaza", "haifa", "jaffa", "hebron", 
    "bethlehem", "ramallah", "jericho", "nazareth"
  ],
  // Tier 2: Well known - most kids would recognize
  known: [
    "acre", "tulkarm", "jenin", "qalqilya", "salfit", "tubas",
    "khan-yunis", "rafah", "deir-al-balah", "beersheba", "safad", "tiberias"
  ],
  // Tier 3: Less known - require more knowledge
  lessKnown: [
    "beisan", "ramla", "lod", "ashkelon", "ashdod", "um-al-fahm",
    "shefa-amr", "tayibe", "baqa-al-gharbiyye", "sakhnin", "arraba",
    "tamra", "maghar", "kafr-qasim", "rahat", "sebastia", "yibna",
    "majdal-krum", "umm-rashrash", "ras-al-naqoura", "al-bireh",
    "beit-jala", "beit-sahour", "qalansawe"
  ]
} as const;

/**
 * Preferred region order for diverse gameplay
 * Each round should ideally be from a different region
 */
const REGION_PRIORITY: CityRegion[] = [
  "west-bank",  // Start with heart of Palestine
  "galilee",    // Then north
  "coast",      // Then coast
  "gaza",       // Then Gaza
  "interior",   // Then 1948 territories
  "negev"       // Finally south
];

type CityRegion = "west-bank" | "gaza" | "interior" | "galilee" | "negev" | "coast";

/**
 * Get fame tier for a city
 */
function getCityFameTier(cityId: string): "famous" | "known" | "lessKnown" {
  if (CITY_FAME_LEVELS.famous.includes(cityId as typeof CITY_FAME_LEVELS.famous[number])) return "famous";
  if (CITY_FAME_LEVELS.known.includes(cityId as typeof CITY_FAME_LEVELS.known[number])) return "known";
  return "lessKnown";
}

/**
 * Smart city selection with:
 * 1. Age-aware difficulty (younger kids = famous cities)
 * 2. Progressive difficulty (famous cities first)
 * 3. Regional diversity (different regions each round)
 * 4. Deterministic seed for consistent sessions
 */
export function getCityForRound(
  excludeIds?: string[],
  roundNumber: number = 1,
  difficulty: GameDifficulty = "medium",
  sessionSeed?: number,
  age: number = 8
): { city: City; isReviewMode: boolean } {
  // Get available cities
  const pool = excludeIds?.length
    ? CITIES.filter((c) => !excludeIds.includes(c.id))
    : CITIES;

  const isReviewMode = pool.length === 0;
  if (isReviewMode) {
    // All cities discovered - random pick from all
    const index = sessionSeed !== undefined 
      ? Math.abs(sessionSeed + roundNumber) % CITIES.length 
      : Math.floor(Math.random() * CITIES.length);
    return { city: CITIES[index], isReviewMode };
  }

  // Determine fame tier based on age, round number, and difficulty
  let fameTier: "famous" | "known" | "lessKnown";
  
  // Age-based adjustments
  const isYoungChild = age <= 6;
  const isOlderChild = age >= 10;
  
  if (difficulty === "easy" || isYoungChild) {
    // Easy or young child: always famous cities
    fameTier = "famous";
  } else if (difficulty === "hard" && isOlderChild) {
    // Hard + older child: can start with less known
    fameTier = roundNumber <= 2 ? "lessKnown" : "known";
  } else if (difficulty === "hard") {
    // Hard (normal age): less known then known
    fameTier = roundNumber <= 2 ? "lessKnown" : "known";
  } else {
    // Medium: famous first, then known
    fameTier = roundNumber <= 2 ? "famous" : "known";
  }

  // Get cities from the appropriate fame tier
  const tierCityIds = CITY_FAME_LEVELS[fameTier] as readonly string[];
  const tierCities = pool.filter(c => tierCityIds.includes(c.id));

  // If no cities in this tier, fall back to available pool
  const candidates = tierCities.length > 0 ? tierCities : pool;

  // Try to pick from a different region than previous rounds
  const usedRegions = excludeIds
    ? CITIES.filter(c => excludeIds.includes(c.id)).map(c => c.region)
    : [];

  // Find a city from an unused region if possible
  const regionOrder = REGION_PRIORITY.filter(r => !usedRegions.includes(r));
  for (const region of regionOrder) {
    const regionCities = candidates.filter(c => c.region === region);
    if (regionCities.length > 0) {
      // Use session seed for deterministic selection, or random
      const index = sessionSeed !== undefined
        ? Math.abs(sessionSeed * roundNumber) % regionCities.length
        : Math.floor(Math.random() * regionCities.length);
      return { city: regionCities[index], isReviewMode: false };
    }
  }

  // Fall back to any available city
  const index = sessionSeed !== undefined
    ? Math.abs(sessionSeed + roundNumber) % candidates.length
    : Math.floor(Math.random() * candidates.length);
  
  return { city: candidates[index], isReviewMode: false };
}

/**
 * Get next regions for hint context
 */
export function getNextRegionHint(currentRegion: CityRegion): string {
  const hints: Record<CityRegion, string> = {
    "west-bank": "بالضفة الغربية",
    "gaza": "بقطاع غزة",
    "interior": "بالداخل المحتل",
    "galilee": "بالجليل",
    "negev": "بالنقب",
    "coast": "على الساحل"
  };
  return hints[currentRegion] || "";
}

// ── Complexity System ─────────────────────────────────────────────────

function getContentComplexity(age: number, difficulty: GameDifficulty): number {
  const clamped = Math.max(4, Math.min(12, age));
  const ageBase = 1 + ((clamped - 4) / 8) * 5;
  const offset: Record<GameDifficulty, number> = { easy: 0, medium: 1.5, hard: 3 };
  return Math.max(1, Math.min(10, Math.round(ageBase + offset[difficulty])));
}

function getComplexityGuidance(level: number): string {
  if (level <= 3) return `Complexity ${level}/10: Obvious clues (e.g. "بحر وبرتقال 🍊" → يافا)`;
  if (level <= 5) return `Complexity ${level}/10: Known features (e.g. "كنافة مشهورة 🍰" → نابلس)`;
  if (level <= 7) return `Complexity ${level}/10: Regional + cultural (e.g. "شمال + زيتون" → جنين)`;
  return `Complexity ${level}/10: Historical context (e.g. "مركز تجارة قديم" → عكا)`;
}

function buildDifficultySection(difficulty: GameDifficulty, age: number): string {
  const level = getContentComplexity(age, difficulty);
  const options = { easy: 2, medium: 3, hard: 4 }[difficulty];
  const hintCost = { easy: "FREE", medium: "1 pt", hard: "2 pts" }[difficulty];
  
  return `## Difficulty: ${difficulty.toUpperCase()} (Level ${level}/10)
${getComplexityGuidance(level)}
- Options: ${options} | Hint cost: ${hintCost}`;
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

/**
 * Compact next-city section — only what the AI needs to write the riddle/hint/options
 */
function formatNextCityData(city: City): string {
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.slice(0, 3).map((f, i) => `${i + 1}. ${f}`).join(" | ");
  return `## Next City Data (use AFTER correct answer + advance_round)
🎯 NEXT ANSWER: ${city.nameAr} (${city.name})
📍 Region: ${regionInfo.nameAr}
📝 Facts: ${facts}
🍽️ Food: ${city.famousFor.food} | 🏛️ Landmark: ${city.famousFor.landmark}
📖 ${city.descriptionAr}`;
}

export function buildSystemPrompt(
  difficulty: GameDifficulty,
  age: number,
  playerName?: string,
  chatContext?: KidsChatContext,
  excludeIds?: string[],
  roundNumber: number = 1,
  sessionSeed?: number
): string {
  const { city, isReviewMode } = getCityForRound(excludeIds, roundNumber, difficulty, sessionSeed, age);
  const regionInfo = REGIONS[city.region];

  // Pre-load next city so the AI can present it immediately after a correct answer
  const nextExcludeIds = [...(excludeIds || []), city.id];
  const { city: nextCity } = getCityForRound(nextExcludeIds, roundNumber + 1, difficulty, sessionSeed, age);

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

    // 6. Difficulty (semi-static — per session)
    buildDifficultySection(difficulty, age),

    // 7. Age adaptation (semi-static — per session)
    buildAgeAdaptationSection(age),

    // 8. Player name (semi-static — per session)
    playerName ? `## Player: ${playerName}\nUse their name naturally every 2–3 messages — not every sentence.` : "",

    // 9. Chat context (dynamic)
    chatContext?.recentTopics?.length
      ? `## Context: Player was talking about ${chatContext.recentTopics.join(", ")}`
      : "",

    // 10. Target city (dynamic — changes per round)
    `⚠️ TARGET CITY: ${city.nameAr} | Region: ${regionInfo.nameAr} | NEXT: ${nextCity.nameAr}`,

    // 11. City data current (dynamic)
    formatCityData(city, isReviewMode),

    // 12. Next city data (dynamic)
    formatNextCityData(nextCity),

    // 13. CRITICAL REMINDER at END (LLM pays attention to end)
    `⚠️ CHECKLIST before responding:
✅ Every response ends with GAME_TURN:{"options":[...]} (except end_game)
✅ Current question: GAME_TURN options include "${city.nameAr}"
✅ Correct answer? → advance_round + new riddle for ${nextCity.nameAr} + GAME_TURN with "${nextCity.nameAr}"
✅ Wrong answer? → encouragement + GAME_TURN with SAME options (${city.nameAr} still in list)
✅ Off-topic? → 1-2 sentence reply + GAME_TURN with current options`,
  ];

  return parts.filter(Boolean).join("\n\n");
}