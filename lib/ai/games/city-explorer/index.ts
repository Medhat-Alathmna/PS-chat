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
import { GameDifficulty, KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_CHARACTER as MEDHAT_BASE,
  SAFETY_RULES,
} from "../../kids";
import { buildAgeAdaptationSection, getAgeSettings } from "./age";
import {
  checkAnswerTool,
  giveHintTool,
  advanceRoundTool,
  endGameTool,
  suggestRepliesTool,
} from "../../game-tools";
import { imageSearchTool } from "../../tools";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";

// ── Opt-in: trim completed-round messages server-side ────────────────
export const trimCompletedRounds = true;

// ── Tool collection ──────────────────────────────────────────────────

/**
 * Build game tools with validated present_options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTools(correctCityNameAr: string, correctCityId?: string): Record<string, any> {
  const wrappedGiveHint = correctCityId
    ? tool({
        description: "Provide hint with optional image. Call WITH present_options. Deduction: Easy=0, Medium=1, Hard=2.",
        inputSchema: z.object({
          hint: z.string().describe("Hint in Palestinian Arabic"),
          pointsDeduction: z.number().describe("Easy=0, Medium=1, Hard=2"),
          imageQuery: z.string().optional().describe("Image search with city name (e.g. 'كنافة نابلسية')"),
        }),
        execute: async ({ hint, pointsDeduction, imageQuery }) => {
          let images;
          if (imageQuery) {
            try {
              const results = await searchImagesMultiSource(imageQuery, 2, true);
              if (results.length > 0) images = results;
            } catch { /* skip */ }
          }
          return { hint, pointsDeduction, images, targetCityId: correctCityId };
        },
      })
    : giveHintTool;

  return {
    check_answer: checkAnswerTool,
    give_hint: wrappedGiveHint,
    advance_round: advanceRoundTool,
    present_options: tool({
      description: "Show clickable options. CORRECT ANSWER MUST BE INCLUDED! Frontend adds 1️⃣2️⃣3️⃣.",
      inputSchema: z.object({
        options: z.array(z.string()).min(2).max(6).describe("Option texts. MUST include correct city!"),
        allowHint: z.boolean().describe("Show hint button?"),
      }),
      execute: async ({ options, allowHint }) => {
        let validatedOptions = [...options];
        if (!validatedOptions.includes(correctCityNameAr)) {
          const insertIdx = Math.floor(Math.random() * (validatedOptions.length + 1));
          validatedOptions.splice(insertIdx, 0, correctCityNameAr);
          console.warn(`[city-explorer] Auto-injected correct answer: ${correctCityNameAr}`);
        }
        return { options: validatedOptions, allowHint, displayed: true };
      },
    }),
    end_game: endGameTool,
    image_search: imageSearchTool,
    suggest_replies: suggestRepliesTool,
  };
}

// ── Core Rules (Optimized ~1500 chars vs ~6000 before) ────────────────

const CORE_RULES = `## Game: City Explorer 🗺️

### Flow (State Machine):
QUIZ → correct → TOUR (food→landmark→craft) → NEXT CITY → QUIZ

### QUIZ Phase:
1. Read City Data → give hint from fact #1 → call present_options + give_hint together
2. Player answers → check_answer (accept typed city names too!)
3. Wrong answer → short encouragement "قريب! جرّب كمان 😊" (no new options)
4. "I don't know" → give_hint (FREE in Easy mode)
5. Correct → welcome to city (rephrase descriptionAr) + image_search + suggest_replies

### TOUR Phase:
- Drip-feed ONE category per message: food → landmark → craft
- Each: narrate 2-3 sentences + image_search + present_options (fun choices, all "correct")
- After each: suggest_replies ["احكيلي أكتر", "وريني صور!", "السؤال الجاي"]
- "السؤال الجاي" → advance_round immediately, then next hint

### Critical Rules:
✅ Use ONLY City Data facts — never invent facts
✅ CORRECT_ANSWER must be in present_options
✅ Image queries MUST include city name (e.g. "كنافة نابلسية")
❌ NEVER mention coordinates/lat/lng
❌ NEVER dump all tour data at once`;

// ── Tool Quick Reference ─────────────────────────────────────────────

const TOOL_REFERENCE = `## Tool Combos:
- present_options + give_hint (quiz start)
- check_answer + image_search + suggest_replies (correct answer)
- give_hint + image_search ("I don't know")

## suggest_replies Format:
{ suggestions: [{ text, type, actionQuery? }], showHintChip }
- type: "photo" (needs actionQuery) | "map" (needs actionQuery) | "curiosity" | "activity"
- Example: { text: "وريني صور!", type: "photo", actionQuery: "نابلس البلدة القديمة" }`;

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
  
  const parts: string[] = [
    // 1. CRITICAL: Target city FIRST (LLM pays most attention to start)
    `⚠️ TARGET CITY: ${city.nameAr} | Region: ${regionInfo.nameAr}`,
    
    // 2. Character
    MEDHAT_BASE,
    
    // 3. Core rules (compact)
    CORE_RULES,
    
    // 4. City data
    formatCityData(city, isReviewMode),
    
    // 5. Difficulty
    buildDifficultySection(difficulty, age),
    
    // 6. Age adaptation
    buildAgeAdaptationSection(age),
    
    // 7. Player name
    playerName ? `## Player: ${playerName}\nAddress by name in EVERY response.` : "",
    
    // 8. Chat context
    chatContext?.recentTopics?.length 
      ? `## Context: Player was talking about ${chatContext.recentTopics.join(", ")}` 
      : "",
    
    // 9. Game info
    `## Game: مستكشف المدن | Rounds: 5 | Points: 15/correct | Bonus: 25`,
    
    // 10. Safety
    SAFETY_RULES,
    
    // 11. Tool reference
    TOOL_REFERENCE,
    
    // 12. CRITICAL REMINDER at END (LLM pays attention to end)
    `⚠️ CHECKLIST before responding:
✅ Hint about ${city.nameAr}? (not other cities!)
✅ ${city.nameAr} in present_options? (player must win!)
✅ Image query includes "${city.nameAr}"?
✅ Tour: ONE category per message?`,
  ];

  return parts.filter(Boolean).join("\n\n");
}