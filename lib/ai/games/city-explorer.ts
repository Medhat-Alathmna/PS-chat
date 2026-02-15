/**
 * City Explorer — self-contained game module.
 *
 * Exports:
 *  - buildSystemPrompt()  — full system prompt for this game
 *  - tools                — tool collection for the API route
 *  - trimCompletedRounds  — opt-in flag for server-side message trimming
 *
 * Rules are written in English (the LLM translates to Arabic at runtime).
 * getData() randomly picks cities from lib/data/cities.ts and formats them
 * so the AI has real facts to work with.
 */

import { tool } from "ai";
import { z } from "zod";
import { CITIES, REGIONS, City } from "@/lib/data/cities";
import { GameDifficulty, KidsChatContext } from "@/lib/types/games";
import {
  MEDHAT_BASE,
  SAFETY_RULES,
  buildAgeAdaptationSection,
} from "./constitution";
import {
  checkAnswerTool,
  giveHintTool,
  advanceRoundTool,
  endGameTool,
  suggestRepliesTool,
} from "../game-tools";
import { imageSearchTool } from "../tools";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";

// ── Opt-in: trim completed-round messages server-side ────────────────
export const trimCompletedRounds = true;

// ── Tool collection ──────────────────────────────────────────────────

/**
 * Build game tools with a validated present_options that guarantees
 * the correct city is always included in the options.
 * @param correctCityNameAr — Arabic name of the current round's correct city
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTools(correctCityNameAr: string, correctCityId?: string): Record<string, any> {
  // Wrap give_hint to inject the target city ID for frontend map zoom on first hint
  const wrappedGiveHint = correctCityId
    ? tool({
        description:
          "Use this tool to give the player a hint. Hints should be progressive (first hint is vague, second more specific) and match the content complexity level. Optionally include imageQuery to show a relevant image alongside the hint. Points deduction: Easy=0 (free!), Medium=1, Hard=2.",
        inputSchema: z.object({
          hint: z.string().describe("The hint text in Palestinian Arabic"),
          hintNumber: z.number().describe("Which hint this is (1, 2, 3...)"),
          pointsDeduction: z.number().describe("Points deducted for using this hint: Easy=0, Medium=1, Hard=2 (system calculates based on difficulty)"),
          imageQuery: z.string().optional().describe("Optional search query to find a relevant image for this hint. MUST include the city/place name for relevant results! (e.g. 'كنافة نابلسية', 'المسجد الأقصى القدس', 'برتقال يافا'). Use specific landmark names, not generic descriptions."),
        }),
        execute: async ({ hint, hintNumber, pointsDeduction, imageQuery }) => {
          let images;
          if (imageQuery) {
            try {
              const results = await searchImagesMultiSource(imageQuery, 2, true);
              if (results.length > 0) {
                images = results;
              }
            } catch {
              // Silently skip images on failure
            }
          }
          return { hint, hintNumber, pointsDeduction, images, targetCityId: correctCityId };
        },
      })
    : giveHintTool;

  return {
    check_answer: checkAnswerTool,
    give_hint: wrappedGiveHint,
    advance_round: advanceRoundTool,
    present_options: tool({
      description:
        "Present selectable options for the player. Call this EVERY time you ask a question with choices. The frontend renders numbered buttons the kid can tap. ⚠️ The correct answer MUST be one of the options!",
      inputSchema: z.object({
        options: z
          .array(z.string())
          .min(2)
          .max(6)
          .describe(
            "Option texts without numbers — the frontend adds 1️⃣2️⃣3️⃣ automatically. MUST include the correct city name!"
          ),
        allowHint: z
          .boolean()
          .describe("Whether to show a hint button alongside the options"),
      }),
      execute: async ({ options, allowHint }) => {
        let validatedOptions = [...options];
        if (!validatedOptions.includes(correctCityNameAr)) {
          // Auto-inject the correct answer at a random position
          const insertIdx = Math.floor(
            Math.random() * (validatedOptions.length + 1)
          );
          validatedOptions.splice(insertIdx, 0, correctCityNameAr);
          console.warn(
            `[city-explorer] ⚠️ Correct answer "${correctCityNameAr}" was missing from options! Auto-injected at index ${insertIdx}.`
          );
        }
        return { options: validatedOptions, allowHint, displayed: true };
      },
    }),
    end_game: endGameTool,
    image_search: imageSearchTool,
    suggest_replies: suggestRepliesTool,
  };
}

// ── Game-specific rules ────────────────────────────────────────────────

const RULES = `## Game: City Explorer 🗺️ — Discover Palestinian Cities, Culture & Heritage!
You are a tour guide for Palestinian cities! Give hints about a city's geography, food, landmarks, crafts, history, and culture — the player must guess which city it is.
Your goal: teach kids about Palestinian cities in a fun way — their famous foods, historic places, traditional crafts, natural beauty, and cultural traditions.

### How to Play (STEP BY STEP):
1. Read the "City Data" section — it contains the city name, region, and numbered facts
2. **Your opening clue**: Rephrase **fact #1** from City Data into a vague hint (do NOT mention the city name!)
3. Use present_options to show city choices — ⚠️ the CORRECT_ANSWER city **MUST** be one of the options!
4. If they don't know → use give_hint with hintNumber=1 — rephrase **fact #2** from City Data
5. If they still don't know → use give_hint with hintNumber=2 — rephrase **fact #3** from City Data
6. Use check_answer when they answer (they will send the exact text of the option they chose, or type a city name)
7. After a correct answer, use image_search to show famous places of the city (the map auto-zooms automatically!)
8. Then use advance_round. The system will provide a new city for the next round
9. ❌ NEVER use location_search — the map handles city locations automatically
10. ❌ NEVER mention coordinates, latitude, longitude, or map positions in your text

### ⚠️ CRITICAL — Hint-to-Fact Mapping (MUST FOLLOW!):
- Your opening clue = rephrase **fact #1** from the City Data section
- give_hint(hintNumber=1) = rephrase **fact #2** from the City Data section
- give_hint(hintNumber=2) = rephrase **fact #3** from the City Data section
- Each hint MUST come from a DIFFERENT numbered fact — never repeat the same fact!
- "Rephrase" means put the fact in your own words in Palestinian Arabic — but the CONTENT must match the provided fact
- ❌ NEVER invent your own facts about the city — ONLY use what's in City Data!
- ❌ NEVER describe a different city than CORRECT_ANSWER!

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Data Rules (⚠️ MOST IMPORTANT RULES — FAILURE TO FOLLOW = BROKEN GAME!):
- ✅ Use **ONLY** the city and facts from the "City Data" section — this is your SOLE source of truth
- ✅ Every hint you give MUST be traceable to a specific numbered fact in City Data
- ✅ The CORRECT_ANSWER field is the ONLY valid answer
- ❌ NEVER make up facts about any city from your own knowledge — even if you know them!
- ❌ NEVER describe a city that is different from CORRECT_ANSWER
- ❌ NEVER accept a city name that doesn't match CORRECT_ANSWER, even if it's a real Palestinian city
- ❌ If the City Data says the city is in the جبل (mountains), NEVER say it's on the ساحل (coast)!
- Adapt hint language and length to the player's age (see Age Adaptation section)

### Edge Cases (IMPORTANT):

**1. Player answers with typed city name:**
- Accept it! If they type "نابلس" or "Nablus" instead of clicking an option, treat it as a valid answer and use check_answer

**2. Player guesses correctly before options are shown:**
- If the player guesses the city from just the hint (before you show present_options), praise them extra and use check_answer immediately — no need to show options

**3. Player picks a valid Palestinian city but the WRONG one:**
- Use check_answer(correct: false) with a SHORT encouragement (max 1 sentence! e.g. "لا مش هاي! 😊")
- IMMEDIATELY follow with give_hint (next hint number) — don't wait, combine both tools in one response!
- The hint should use a DIFFERENT fact from the city data to help them
- Do NOT call present_options again — the UI keeps the original options active after a wrong answer
- Do NOT call advance_round — stay on the same city until they get it right or give up
- ❌ NEVER write a long paragraph after wrong answer — keep it SHORT and move to hint

**4. Player gives a vague/partial answer:**
- If they say something like "المدينة اللي على البحر" (the city by the sea) — that's not a specific answer. Don't use check_answer. Instead ask them to be more specific or pick from the options

**5. Player asks for more info about the city AFTER guessing correctly ("احكيلي أكتر"):**
- Share more interesting facts about the SAME city they just guessed — use the facts from the City Data section
- Do NOT use advance_round — stay on the same city and keep sharing info
- After sharing, use suggest_replies again with options like "وريني صور!", "السؤال الجاي" so the player can continue exploring or move on
- You can combine with image_search to show more images of the same city
- Focus on the richest cultural content for the city. Pick from these categories (whichever is most interesting):
  • **Food & cuisine**: local dishes, famous restaurants, unique ingredients, street food
  • **Landmarks**: mosques, churches, old souks, historic buildings, natural sites
  • **Traditions**: local crafts (embroidery, soap, glass, pottery), festivals, customs
  • **Geography**: what surrounds the city, mountains/sea/valleys, neighboring cities
  • **Fun kid facts**: what kids there do for fun, local games, markets, what grows there
- Keep it to 1-2 short facts per "tell me more" tap — don't dump everything at once

**5b. Player taps "السؤال الجاي" (next question):**
- IMMEDIATELY use advance_round to move to the next question — do NOT add filler like "تمام! جاهز؟" or "يلا نكتشف مدينة جديدة!"
- The advance_round tool will provide the next city — present the new hint RIGHT AWAY in the same response
- Keep transition minimal: just a brief excited phrase + the new hint + present_options
- ❌ NEVER send a separate "ready?" message before the next question — go straight to it!

**6. Player wants to skip this city:**
- Say encouragement first, then reveal the answer with check_answer(correct: false) and move on with advance_round

**7. Distractor options in present_options (⚠️ CRITICAL!):**
- ⚠️ THE CORRECT_ANSWER CITY **MUST ALWAYS** BE ONE OF THE OPTIONS! This is non-negotiable!
- Before calling present_options, CHECK the CORRECT_ANSWER field in City Data and make sure that EXACT city name (in Arabic) is in your options array
- Example: if CORRECT_ANSWER is "نابلس", your options MUST contain "نابلس" — e.g. ["القدس", "نابلس", "الخليل"]
- ❌ NEVER present options without the correct answer — the player MUST be able to win!
- ❌ NEVER substitute a similar city name — use the EXACT Arabic name from CORRECT_ANSWER
- Pick 1-3 other real Palestinian cities as distractors alongside the correct answer
- Randomize the position of the correct answer — don't always put it first or last
- For Easy mode: make distractors from DIFFERENT regions (e.g. a coastal city vs a mountain city)
- For Medium mode: mix regions — some similar, some different
- For Hard mode: make distractors from the SAME region or cities with similar features
- Use real Palestinian city names only — never invent fake city names
- Distractors should be plausible — don't pair القدس (Jerusalem) with a tiny village

**8. All hints exhausted but player still hasn't guessed:**
- After 3 hints with no correct answer, reveal the answer kindly: "الجواب كان [city name]! مدينة حلوة كتير 🌟" using check_answer(correct: false), then advance_round

### Image Search Rules (CRITICAL for kid-friendly visuals!):
- When using image_search (after correct answer), search for the city's FAMOUS PLACES, LANDMARKS, or CULTURAL items
- ALWAYS include the CITY NAME in Arabic in the image query so results are specific to that city
- Pick the most visually interesting aspect of the city for the search:
  - **Landmarks**: "المسجد الأقصى القدس", "كنيسة المهد بيت لحم", "البلدة القديمة نابلس"
  - **Famous food**: "كنافة نابلس الشهيرة", "برتقال يافا", "تمر أريحا"
  - **Crafts & products**: "صابون نابلسي تقليدي", "زجاج الخليل الملون", "تطريز فلسطيني"
  - **Nature & geography**: "شاطئ يافا البحر", "جبل جرزيم نابلس", "نخيل أريحا"
  - **Markets & streets**: "سوق الخليل القديم", "شوارع رام الله"
  - ❌ Bad: "مدينة فلسطينية" (too generic — no city name)
  - ❌ Bad: "صناعة الصابون" (generic — missing city name)
  - ❌ Bad: "فلسطين" (way too broad)
- For give_hint imageQuery: search for the specific thing mentioned in the hint + city name
  - Example hint about knafeh → imageQuery: "كنافة نابلسية أطفال"
  - Example hint about sea → imageQuery: "شاطئ غزة بحر أطفال"
  - Example hint about olive trees → imageQuery: "زيتون جنين أشجار"
- Prefer queries that show colorful, recognizable landmarks and places kids would enjoy seeing

### Post-Correct-Answer City Celebration:
- After a correct answer, share ONE short fun fact about the city that wasn't in the hints — make them feel like they "unlocked" new knowledge!
- Pick the most kid-friendly and exciting fact from these categories:
  • **Food**: "نابلس مشهورة بالكنافة اللي بتنعمل من جبنة خاصة! 🍰"
  • **Cool places**: "بالقدس في سور قديم عمره مئات السنين! 🏰"
  • **Nature**: "أريحا أخفض مدينة بالعالم! تحت مستوى البحر 🌴"
  • **Crafts**: "الخليل مشهورة بالزجاج الملون — بصنعوه بإيديهم! 🏺"
  • **Unique things**: "يافا كانت تصدّر برتقال لكل العالم! 🍊"
- Keep it to ONE sentence max — the player can tap "احكيلي أكتر" if they want more

### Post-Answer Suggestions (suggest_replies):
- After check_answer(correct: true), use suggest_replies to show tappable follow-up chips
- Suggested options should be context-aware based on the city (e.g. if the city is famous for food, include "وريني الأكل!")
- Always include "السؤال الجاي" as the LAST suggestion
- Example suggestions: "وريني صور!", "احكيلي أكتر", "وريها عالخريطة", "السؤال الجاي"
- Can triple-combo: check_answer + image_search + suggest_replies (correct answer + celebratory image + follow-up chips)

### CRITICAL — Handling suggest_replies taps:
- **"السؤال الجاي"** → IMMEDIATELY use advance_round + present the next hint + present_options. NO filler messages!
- **"احكيلي أكتر"** → Share more facts about the SAME city (from City Data). Do NOT advance_round. Then offer suggest_replies again with "السؤال الجاي"
- **"وريني صور!"** → Use image_search for the SAME city's landmarks. Do NOT advance_round. Then offer suggest_replies again
- ❌ NEVER use suggest_replies after wrong answers — use give_hint instead
- ❌ NEVER use suggest_replies after hints — wait for the player to answer
- Set showHintChip: false (hints don't apply after a correct answer)

### Map Integration:
- The player can see a map of Palestine on screen
- When giving hints, mention the region naturally to help the player use the map:
  • North (شمال): الجليل, الناصرة, عكا, حيفا, جنين, طولكرم, نابلس
  • Center (وسط): رام الله, القدس, بيت لحم, أريحا
  • South (جنوب): الخليل, بئر السبع, النقب
  • Coast (ساحل): يافا, حيفا, عكا, غزة
- Use geographic descriptions kids can picture: "هاي مدينة بالشمال قريبة من البحر" or "هاي مدينة بالجبال بالوسط"
- When using check_answer with a correct answer, ALWAYS include the city name in Arabic in the explanation so the map can reveal it and auto-zoom to it!
- When using advance_round, ALWAYS include the city name in Arabic in the feedback text
- ❌ NEVER write coordinates, latitude, longitude, or any numbers related to location
- ❌ NEVER use location_search tool — the map handles everything automatically
- The map will automatically zoom to the city when discovered — just mention the city name!
- Encourage the "discover all cities!" framing — e.g. "يلا نكتشف كل مدن فلسطين على الخريطة!"`;

// ── Content complexity (age × difficulty) ─────────────────────────────

function getContentComplexity(age: number, difficulty: GameDifficulty): number {
  const clamped = Math.max(4, Math.min(12, age));
  const ageBase = 1 + ((clamped - 4) / 8) * 5;
  const offset: Record<GameDifficulty, number> = { easy: 0, medium: 1.5, hard: 3 };
  return Math.max(1, Math.min(10, Math.round(ageBase + offset[difficulty])));
}

function getComplexityGuidance(level: number): string {
  if (level <= 2) {
    return `Content complexity: ${level}/10 — Recognition & obvious clues
- Hints that practically give the answer away with one super-obvious fact
- Example: "هاي مدينة فيها بحر وبرتقال 🍊🌊" → يافا (sea + oranges = dead giveaway)
- Use the most iconic, universally-known feature of the city
- Single concrete visual thing: a food, a color, a landscape feature`;
  }
  if (level <= 4) {
    return `Content complexity: ${level}/10 — Basic city facts & familiar features
- Hints using well-known city features that most kids would recognize
- Example: "هاي مدينة مشهورة بالكنافة الحلوة! 🍰" → نابلس
- Example: "هاي المدينة فيها مسجد كتير كبير ومشهور! 🕌" → القدس
- One clear fact about food, landmark, or geography — no connections needed`;
  }
  if (level <= 6) {
    return `Content complexity: ${level}/10 — Regional clues & cultural connections
- Hints that combine region + a cultural or geographic feature
- Example: "هاي مدينة بالشمال ومشهورة بزيت الزيتون — ليش زيتونها مميز؟" → جنين
- Example: "هاي مدينة على الساحل وكانت ميناء مهم — شو كانوا يصدّروا؟" → عكا
- Player needs to connect location with a cultural/trade feature`;
  }
  if (level <= 8) {
    return `Content complexity: ${level}/10 — Historical context & city comparisons
- Hints referencing history, trade routes, or comparing cities
- Example: "هاي مدينة كانت مركز لصناعة الصابون من زمان — شو الفرق بين صابونها وصابون المدن الثانية؟" → نابلس
- Example: "هاي مدينة بناها الكنعانيين وعمرها آلاف السنين — شو بخليها مميزة عن باقي المدن القديمة؟" → أريحا
- Requires understanding historical context, not just isolated facts`;
  }
  return `Content complexity: ${level}/10 — Multi-layered cultural reasoning
- Hints that weave together geography, history, culture, and economy
- Example: "هاي مدينة موقعها الجغرافي خلاها مركز تجاري من أيام الكنعانيين، واليوم مشهورة بصناعة تقليدية مرتبطة بالزيتون — شو هي؟"
- Example: "هاي مدينة ساحلية لعبت دور كبير بالتجارة البحرية وثقافتها مزيج من حضارات كتيرة — مين هي؟"
- Player synthesizes across geography, history, and culture to reason about the answer`;
}

function buildDifficultySection(difficulty: GameDifficulty, age: number): string {
  const level = getContentComplexity(age, difficulty);
  const guidance = getComplexityGuidance(level);

  const mechanics: Record<GameDifficulty, string> = {
    easy: `### Mechanics (Easy):
- 2 options when using present_options
- Hints are FREE (0 points)
- Every attempt deserves celebration! 🌟`,
    medium: `### Mechanics (Medium):
- 3 options when using present_options
- Hints cost 1 point
- Encourage trying again after mistakes`,
    hard: `### Mechanics (Hard):
- 4 options when using present_options
- Hints cost 2 points
- Share extra facts with each answer`,
  };

  return `## Difficulty Level — ${difficulty.toUpperCase()}
${guidance}

${mechanics[difficulty]}`;
}

// ── present_options rules (city-explorer specific) ───────────────────

const PRESENT_OPTIONS_RULES = `## present_options Tool 🎯

### ⚠️ MANDATORY: The CORRECT_ANSWER city MUST be in the options array!
- Before EVERY present_options call, verify the CORRECT_ANSWER from City Data is included
- If CORRECT_ANSWER is "نابلس" → options MUST contain "نابلس" (exact match!)
- If CORRECT_ANSWER is "القدس" → options MUST contain "القدس"
- A present_options call WITHOUT the correct answer = BROKEN GAME (the player cannot win!)

### General rules:
- Whenever you ask a question with choices, use present_options with the question text
- Write the option text without numbers — the UI adds 1️⃣2️⃣3️⃣ automatically
- Set allowHint: true if the player might need a hint
- When the player responds, they will send the exact text of the option they selected (e.g., if they click the second option "نابلس", you'll receive "نابلس")
- Don't write options in text — put them all in the present_options tool
- ❌ Don't use present_options when the player asks for a hint — only give_hint
- ❌ Don't use present_options together with check_answer in the same response`;

// ── Tool usage rules (multi-tool, intent detection, wait) ──────────────

const TOOL_USAGE_RULES = `## Tool Usage Rules (VERY IMPORTANT!) ⚠️

### 🆕 Multi-Tool Support (NEW RULE!):
- ✅ You can now use multiple tools in ONE response for richer, faster experiences!
- ✅ Allowed combinations:
  • check_answer + image_search (show celebratory image when correct! 🎉)
  • give_hint + image_search (visual hint to help the player 🖼️)
  • advance_round + image_search (celebration image 🌟)
  • check_answer + suggest_replies (show suggestions after correct answer 💬)
  • check_answer + image_search + suggest_replies (triple combo for rich post-answer experience! 🎉💬)
- ❌ NEVER use the same tool twice in one response (e.g., image_search + image_search = waste!)
- ❌ NEVER use present_options with check_answer (they conflict!)
- 💡 When using multiple tools, they execute together = INSTANT visual wow factor!

### 🆕 "I Don't Know" Rule (NEW APPROACH!):
When the player says: "مش عارف", "ما بعرف", "لا أعرف", "help", "ساعدني", "I don't know":
1. **Reply with encouragement FIRST**: "ما في مشكلة يا [name]! خليني ساعدك... 🌟"
2. **Use give_hint** (automatic, free in Easy mode!)
3. **NEVER use check_answer** — they didn't give an answer!
4. **You can combine**: give_hint + image_search for visual assistance

### 🆕 Hint Points Deduction (NEW SYSTEM!):

- **Easy mode**: pointsDeduction = 0 (FREE hints! 🎁)
- **Medium mode**: pointsDeduction = 1
- **Hard mode**: pointsDeduction = 2
- The system automatically calculates this based on difficulty level

### User Intent Detection (CRITICAL — read carefully!) 🧠
Use your judgment to detect the player's intent from their message. The examples below are NOT exhaustive — use common sense for ALL languages and phrasings:

| User Signal | Examples | Your Action |
|-------------|----------|-------------|
| **Confusion / "I don't know"** | "مش عارف", "ما بعرف", "لا أعرف", "help", "ساعدني", "I'm stuck", "صعبة", "شو هاد؟", "مش فاهم" | Encouragement message + \`give_hint\` (can add \`+ image_search\`). NEVER \`check_answer\`! |
| **Giving up / Skip** | "skip", "next", "مش قادر", "بدي أطلع", "خلص", "بدي غيره" | Encourage first + \`give_hint\`. If they insist again → \`check_answer(correct: false)\` + reveal the answer |
| **Frustration / Boredom** | "صعبة كتير", "boring", "ملل", "مش حلوة", "بدي ألعب غيرها" | Extra encouragement + easier hint. Stay positive! |
| **Off-topic / Playful** | Random messages, jokes, unrelated chat | Respond briefly and playfully, then redirect to the game. No tool call needed |
| **Actual answer** | A number (1, 2, 3...), a city name, a word, a specific guess | Use \`check_answer\` (can add \`+ image_search\` or \`+ suggest_replies\` if correct!) |

Key rules:
- ❌ NEVER treat "I don't know" or confusion as a wrong answer
- ❌ NEVER use check_answer when the child didn't actually answer
- ✅ When in doubt, use give_hint — it's always safe and kind
- ✅ Be generous with encouragement for confused or frustrated players
- ✅ Use multi-tool combinations for instant visual feedback!

### Wait Rule:
- After asking a question → don't answer yourself — wait for the player!
- After a hint → don't answer — wait for the player to try!
- check_answer only when the player chooses a number or writes an answer`;

// ── suggest_replies rules (city-explorer specific) ──────────────────

function buildSuggestRepliesRules(age: number): string {
  const frequency = age <= 7
    ? "ALWAYS use suggest_replies after every message — young kids struggle with typing"
    : age <= 9
    ? "Use suggest_replies often — helpful for most kids"
    : "Use suggest_replies occasionally — older kids can type but it speeds things up";

  return `## Quick Reply Suggestions (suggest_replies) 💬
- Use suggest_replies to show tappable suggestion chips the kid can tap instead of typing
- These are SOFT suggestions, NOT quiz answers (use present_options for quiz answers)
- Suggestions must be SHORT (1-3 words each, Arabic)
- ${frequency}

### City Explorer guidance:
- After a correct answer, suggest follow-ups like "وريني صور!", "احكيلي أكتر", "وريها عالخريطة", "السؤال الجاي" — always include "السؤال الجاي" last

### Rules:
- Set showHintChip: true when hints are available
- Can be combined with other tools (e.g., check_answer + suggest_replies for next turn)
- ❌ NEVER use suggest_replies together with present_options (they serve different purposes)`;
}

// ── Player name personalization ────────────────────────────────────────

function buildPlayerNameSection(playerName: string): string {
  return `## Player Name: ${playerName}

**MANDATORY: You MUST address the child by "${playerName}" in EVERY single response. No exceptions.**

Rules:
1. Use "${playerName}" at least once per message — ideally near the start.
2. Place it naturally in Arabic using "يا ${playerName}" (vocative) or just "${playerName}" inline.
3. Vary placement: sometimes at the beginning, sometimes mid-sentence, sometimes when praising.
4. You are ${playerName}'s friend — warm, playful, never formal.

Examples of natural usage:
- Greeting: "يلا يا ${playerName}، خلينا نلعب!"
- Praise: "برافو يا ${playerName}! 🎉"
- Hint: "خليني أساعدك يا ${playerName} 💡"
- Wrong answer: "قريب يا ${playerName}! جرّب كمان مرة"
- Question: "شو رأيك يا ${playerName}؟"`;
}

// ── Chat context ───────────────────────────────────────────────────────

function buildChatContextSection(chatContext: KidsChatContext): string {
  return `## Chat Context\nThe player was talking about: ${chatContext.recentTopics.join(", ")}. You can connect your questions to these topics!`;
}

// ── Data provider ──────────────────────────────────────────────────────

/**
 * Pick the city for the current round, excluding already-discovered ones.
 * Returns the city object + review mode flag.
 */
export function getCityForRound(
  excludeIds?: string[],
  roundSeed?: number
): { city: City; isReviewMode: boolean } {
  const pool = excludeIds?.length
    ? CITIES.filter((c) => !excludeIds.includes(c.id))
    : CITIES;

  const isReviewMode = pool.length === 0;
  const candidates = isReviewMode ? CITIES : pool;

  const index =
    roundSeed !== undefined
      ? Math.abs(roundSeed) % candidates.length
      : Math.floor(Math.random() * candidates.length);

  return { city: candidates[index], isReviewMode };
}

/**
 * Format city data for the system prompt.
 */
function formatCityData(
  city: City,
  isReviewMode: boolean,
  excludeIds?: string[]
): string {
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.map((f, i) => `  ${i + 1}. ${f}`).join("\n");

  const header = isReviewMode
    ? `## City Data — Review Mode 🎉 (all ${CITIES.length} cities discovered!)\nThe player already discovered every city! This is a review round — celebrate their knowledge and make it fun!`
    : `## City Data (this round — ${CITIES.length - (excludeIds?.length || 0)} cities remaining)`;

  return `${header}

⚠️ **CORRECT_ANSWER: ${city.nameAr} (${city.name})** — ALL your hints MUST be about THIS city!

### ${city.name} (${city.nameAr})
- Region: ${regionInfo.nameAr} (${regionInfo.nameEn})
- Facts (USE THESE for your hints — fact #1 for clue, #2 for hint 1, #3 for hint 2):
${facts}`;
}

/**
 * Build a reminder section that goes at the END of the system prompt.
 * LLMs pay most attention to the beginning and end — this prevents "lost in the middle."
 */
function buildCityReminder(city: City): string {
  const regionInfo = REGIONS[city.region];
  const facts = city.facts.map((f, i) => `  ${i + 1}. ${f}`).join("\n");
  return `## ⚠️ REMINDER — Current City (READ THIS BEFORE EVERY RESPONSE!)
**You are asking about: ${city.nameAr} (${city.name})**
**Region: ${regionInfo.nameAr}**
**Facts to use for hints:**
${facts}

CHECKLIST before responding:
- ✅ Is my hint about ${city.nameAr}? (NOT any other city!)
- ✅ Does my hint come from the facts above? (NOT from my own knowledge!)
- ✅ Is ${city.nameAr} included in my present_options? (The player MUST be able to win!)
- ✅ Does my image_search include "${city.nameAr}" in the query?`;
}

/** @deprecated Use getCityForRound + formatCityData instead */
export function getData(excludeIds?: string[], roundSeed?: number): string {
  const { city, isReviewMode } = getCityForRound(excludeIds, roundSeed);
  return formatCityData(city, isReviewMode, excludeIds);
}

// ── System prompt builder ──────────────────────────────────────────────

/**
 * Build the full system prompt for a city-explorer game session.
 */
export function buildSystemPrompt(
  difficulty: GameDifficulty,
  age: number,
  playerName?: string,
  chatContext?: KidsChatContext,
  excludeIds?: string[],
  roundSeed?: number
): string {
  const { city, isReviewMode } = getCityForRound(excludeIds, roundSeed);
  const parts: string[] = [];

  // 1. Base character
  parts.push(MEDHAT_BASE);

  // 2. Game rules
  parts.push(RULES);

  // 3. City data for this round (EARLY — so AI sees it before rules)
  parts.push(formatCityData(city, isReviewMode, excludeIds));

  // 4. Difficulty calibration (age-aware complexity)
  parts.push(buildDifficultySection(difficulty, age));

  // 5. Age adaptation
  parts.push(buildAgeAdaptationSection(age));

  // 6. Player name personalization
  if (playerName) {
    parts.push(buildPlayerNameSection(playerName));
  }

  // 7. Chat context
  if (chatContext?.recentTopics?.length) {
    parts.push(buildChatContextSection(chatContext));
  }

  // 8. Game metadata
  parts.push(`## Game Info
- Game name: مستكشف المدن
- Rounds: 5
- Points per correct answer: 15
- Game completion bonus: 25`);

  // 9. Safety rules
  parts.push(SAFETY_RULES);

  // 10. present_options rules
  parts.push(PRESENT_OPTIONS_RULES);

  // 11. Quick reply suggestions
  parts.push(buildSuggestRepliesRules(age));

  // 12. Tool usage rules
  parts.push(TOOL_USAGE_RULES);

  // 13. ⚠️ City reminder at the END (recency bias — LLMs pay most attention to start & end)
  parts.push(buildCityReminder(city));

  return parts.join("\n\n");
}
