/**
 * City Explorer — Optimized game module (Token-Efficient)
 *
 * Key optimizations:
 * 1. DRY principle - no repeated rules
 * 2. Minimal examples - only essential ones
 * 3. State machine approach - clear transitions
 * 4. Critical info at START and END (recency bias)
 * 5. Separated static vs dynamic content
 */

import { tool } from "ai";
import { z } from "zod";
import { CITIES, REGIONS, City } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { GameDifficulty, KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_CHARACTER as MEDHAT_BASE,
  SAFETY_RULES,
} from "../../kids";
import { buildAgeAdaptationSection, getAgeSettings } from "./age";
import {
  checkAnswerTool,
  advanceRoundTool,
  endGameTool,
  suggestRepliesTool,
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
 * Build game tools with validated present_options + embedded pre-computed hints.
 * Hints are generated server-side from city data — no LLM tool call needed.
 * give_hint is kept only for "I don't know" (text-only, no image search).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTools(
  correctCityNameAr: string,
  correctCityId: string,
  nextCityNameAr: string,
  currentHint: PrecomputedHint,
  nextHint: PrecomputedHint | null
): Record<string, any> {
  // Simplified give_hint: text-only, for "I don't know" case only
  const textOnlyGiveHint = tool({
    description: "Text-only hint when player says 'I don't know'. No images. Deduction: Easy=0, Medium=1, Hard=2. Do NOT call this with present_options — hints are auto-attached to options!",
    inputSchema: z.object({
      hint: z.string().describe("Hint in Palestinian Arabic"),
      pointsDeduction: z.number().describe("Easy=0, Medium=1, Hard=2"),
    }),
    execute: async ({ hint, pointsDeduction }) => {
      return { hint, pointsDeduction, targetCityId: correctCityId };
    },
  });

  return {
    check_answer: checkAnswerTool,
    give_hint: textOnlyGiveHint,
    advance_round: advanceRoundTool,
    present_options: tool({
      description: "Show clickable options with auto-attached hint. CORRECT ANSWER MUST BE INCLUDED! Do NOT call give_hint alongside this — hint is auto-embedded.",
      inputSchema: z.object({
        options: z.array(z.string()).min(2).max(6).describe("Option texts. MUST include correct city!"),
        allowHint: z.boolean().describe("Show hint button?"),
      }),
      execute: async ({ options, allowHint }) => {
        let validatedOptions = [...options];
        const hasCurrentCity = validatedOptions.includes(correctCityNameAr);
        const hasNextCity = nextCityNameAr && validatedOptions.includes(nextCityNameAr);
        // Auto-inject only if neither the current nor the next city answer is present
        if (!hasCurrentCity && !hasNextCity) {
          const insertIdx = Math.floor(Math.random() * (validatedOptions.length + 1));
          validatedOptions.splice(insertIdx, 0, correctCityNameAr);
          console.warn(`[city-explorer] Auto-injected correct answer: ${correctCityNameAr}`);
        }
        // Determine which pre-computed hint to attach:
        // If options contain the NEXT city answer → post-advance question → use nextHint
        const hintForThisQuestion = (hasNextCity && nextHint) ? nextHint : currentHint;
        return { options: validatedOptions, allowHint, displayed: true, hintData: hintForThisQuestion };
      },
    }),
    end_game: endGameTool,
    image_search: imageSearchTool,
    suggest_replies: suggestRepliesTool,
  };
}

// ── Core Rules (Optimized ~1500 chars vs ~6000 before) ────────────────

const CORE_RULES = `## Game: City Explorer

### Flow (State Machine):
QUIZ → correct → advance → NEXT CITY QUIZ (all in ONE response, no extra round-trip!)

### QUIZ Phase:
1. Read City Data → WRITE a fun riddle/clue as TEXT (2-3 sentences) + call present_options. Hint is auto-attached!
2. Player answers → check_answer (accept typed city names too!)
3. Wrong answer → short encouragement (no new options), don't reveal the answer.
4. "I don't know" → give_hint (text-only, FREE in Easy mode)
5. Correct → IN ONE RESPONSE: check_answer + advance_round + WRITE riddle for NEXT CITY + present_options (NEXT CITY answer!). No separate round-trip needed.
6. "السؤال الجاي" (fallback only) → advance_round + WRITE next riddle + present_options (all in ONE response)

CRITICAL: ALWAYS write visible TEXT before/with tool calls! Never send ONLY tool calls without text.
CRITICAL: Do NOT call give_hint with present_options! Hints are auto-attached to present_options.

### Critical Rules:
- Use ONLY City Data facts — never invent facts
- CORRECT_ANSWER must be in present_options (use NEXT CITY answer after advance_round!)
- After correct: BRIEF celebration (1 sentence) → immediately advance + next city question
- NEVER mention coordinates/lat/lng`;

// ── Tool Quick Reference ─────────────────────────────────────────────

const TOOL_REFERENCE = `## Tool Combos:
- present_options (quiz start — hint auto-attached, do NOT call give_hint!)
- check_answer + advance_round + present_options (CORRECT ANSWER — all in ONE response, use NEXT CITY data!)
- give_hint ("I don't know" ONLY — text-only, no images)
- advance_round + present_options ("السؤال الجاي" fallback — all in ONE response)

## suggest_replies Format:
{ suggestions: [{ text, type, actionQuery? }], showHintChip }
- type: "photo" (needs actionQuery) | "map" (needs actionQuery) | "curiosity" | "activity"`;

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

/** @deprecated Use getCityForRound + formatCityData */
export function getData(excludeIds?: string[], roundSeed?: number): string {
  const { city, isReviewMode } = getCityForRound(excludeIds, 1, "medium", roundSeed, 8);
  return formatCityData(city, isReviewMode);
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
    // 1. CRITICAL: Target city FIRST (LLM pays most attention to start)
    `⚠️ TARGET CITY: ${city.nameAr} | Region: ${regionInfo.nameAr} | NEXT: ${nextCity.nameAr}`,

    // 2. Character
    MEDHAT_BASE,

    // 3. Core rules (compact)
    CORE_RULES,

    // 4. City data (current)
    formatCityData(city, isReviewMode),

    // 5. Next city data (compact — for immediate advance after correct answer)
    formatNextCityData(nextCity),

    // 6. Difficulty
    buildDifficultySection(difficulty, age),

    // 7. Age adaptation
    buildAgeAdaptationSection(age),

    // 8. Player name
    playerName ? `## Player: ${playerName}\nAddress by name in EVERY response.` : "",

    // 9. Chat context
    chatContext?.recentTopics?.length
      ? `## Context: Player was talking about ${chatContext.recentTopics.join(", ")}`
      : "",

    // 10. Game info
    `## Game: مستكشف المدن | Rounds: 5 | Points: 15/correct | Bonus: 25`,

    // 11. Safety
    SAFETY_RULES,

    // 12. Tool reference
    TOOL_REFERENCE,

    // 13. CRITICAL REMINDER at END (LLM pays attention to end)
    `⚠️ CHECKLIST before responding:
✅ Active question about ${city.nameAr}? → present_options uses ${city.nameAr} (hint auto-attached)
✅ Correct answer detected? → check_answer + advance_round + riddle for ${nextCity.nameAr} + present_options (${nextCity.nameAr}!) — ALL IN ONE RESPONSE
✅ Player says "I don't know"? → give_hint (text only)
✅ After advance: ${nextCity.nameAr} in present_options? (player must win!)`,
  ];

  return parts.filter(Boolean).join("\n\n");
}