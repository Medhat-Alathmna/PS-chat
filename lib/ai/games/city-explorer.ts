/**
 * City Explorer — per-game rules and data provider.
 *
 * Rules are written in English (the LLM translates to Arabic at runtime).
 * getData() randomly picks cities from lib/data/cities.ts and formats them
 * so the AI has real facts to work with.
 */

import { CITIES, REGIONS } from "@/lib/data/cities";

// ── Game-specific rules ────────────────────────────────────────────────

export const RULES = `## Game: City Explorer 🗺️
You give hints about a Palestinian city and the player must guess.

### How to Play:
1. Use the single city provided in the "City Data" section below
2. Give a vague first hint using one of the city's facts (do NOT mention the city name!)
3. Use present_options to show city choices (without numbers — the UI adds them)
4. If they don't know, give a second hint (clearer) using give_hint — pull from another fact
5. Use check_answer when they answer (number or city name)
6. After a correct answer, use image_search and location_search to show the city
7. Then use advance_round. The system will provide a new city for the next round

### Important: When the player responds with a number (like "2"), it means they chose the second option.

### Data Rules (CRITICAL — READ CAREFULLY!):
- Use ONLY the city and facts provided in the "City Data" section below
- Do NOT invent facts — stick to the provided data
- The CORRECT_ANSWER field is the ONLY valid answer. If the player says ANY other city → check_answer(correct: false)
- ❌ NEVER accept a city name that doesn't match CORRECT_ANSWER, even if it's a real Palestinian city
- Craft your hints from the provided facts: start vague, get more specific
- Adapt hint language and length to the player's age (see Age Adaptation section)

### Edge Cases (IMPORTANT):

**1. Player answers with city name instead of number:**
- Accept it! If they type "نابلس" or "Nablus" instead of choosing option 2, treat it as a valid answer and use check_answer

**2. Player guesses correctly before options are shown:**
- If the player guesses the city from just the hint (before you show present_options), praise them extra and use check_answer immediately — no need to show options

**3. Player picks a valid Palestinian city but the WRONG one:**
- Use check_answer(correct: false), say something like "لا، مش هاي المدينة!" then give another hint using give_hint — don't reveal the answer yet, let them try again

**4. Player gives a vague/partial answer:**
- If they say something like "المدينة اللي على البحر" (the city by the sea) — that's not a specific answer. Don't use check_answer. Instead ask them to be more specific or pick from the options

**5. Player asks for more info about the city AFTER guessing correctly:**
- Share a fun tidbit from the facts, then use advance_round to move on. Keep it brief and enthusiastic

**6. Player wants to skip this city:**
- Say encouragement first, then reveal the answer with check_answer(correct: false) and move on with advance_round

**7. Distractor options in present_options:**
- Always include the correct city as one option
- Pick 2-3 other real Palestinian cities as distractors (from your knowledge — they don't need to be in the data)
- For Easy mode: make distractors very different (e.g. a coastal city vs a mountain city)
- For Hard mode: make distractors from the same region to increase challenge

**8. All hints exhausted but player still hasn't guessed:**
- After 3 hints with no correct answer, reveal the answer kindly: "الجواب كان [city name]! مدينة حلوة كتير 🌟" using check_answer(correct: false), then advance_round

### Map Integration:
- The player can see a map of Palestine on screen
- When giving hints, mention the region (north/south/coast/center) to help the player locate cities on the map
- When using check_answer with a correct answer, ALWAYS include the city name in Arabic in the explanation so the map can reveal it
- Encourage the "discover all cities!" framing — e.g. "let's uncover all of Palestine's cities on the map!"`;

// ── Data provider ──────────────────────────────────────────────────────

/**
 * Pick one random city, excluding already-discovered ones, and format its facts.
 * @param excludeIds City IDs already discovered (persisted + session)
 */
export function getData(excludeIds?: string[]): string {
  const pool = excludeIds?.length
    ? CITIES.filter((c) => !excludeIds.includes(c.id))
    : CITIES;

  const isReviewMode = pool.length === 0;
  // All cities discovered → review mode: pick from full pool
  const candidates = isReviewMode ? CITIES : pool;

  const city = candidates[Math.floor(Math.random() * candidates.length)];
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.map((f, i) => `  ${i + 1}. ${f}`).join("\n");

  const header = isReviewMode
    ? `## City Data — Review Mode 🎉 (all ${CITIES.length} cities discovered!)\nThe player already discovered every city! This is a review round — celebrate their knowledge and make it fun!`
    : `## City Data (this round — ${CITIES.length - (excludeIds?.length || 0)} cities remaining)`;

  return `${header}

**CORRECT_ANSWER: ${city.nameAr} (${city.name})**

### ${city.name} (${city.nameAr})
- Region: ${regionInfo.nameAr} (${regionInfo.nameEn})
- Facts:
${facts}`;
}
