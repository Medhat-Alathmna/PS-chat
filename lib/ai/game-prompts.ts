import { GameId, GameDifficulty, KidsChatContext } from "@/lib/types/games";
import { getGameConfig } from "@/lib/data/games";
import {
  MEDHAT_BASE,
  SAFETY_RULES,
  GAMES_WITH_OPTIONS,
  GAMES_WITH_SUGGEST_REPLIES,
  PRESENT_OPTIONS_RULES,
  TOOL_USAGE_RULES,
  buildDifficultySection,
  buildSuggestRepliesRules,
  buildPlayerNameSection,
  buildChatContextSection,
  buildGameMetadataSection,
  buildAgeAdaptationSection,
} from "@/lib/ai/games/constitution";

// Per-game modules (add imports here as games are migrated)
import * as cityExplorer from "@/lib/ai/games/city-explorer";

// ── Per-game module registry ───────────────────────────────────────────

type GameModule = {
  RULES: string;
  getData?: (excludeIds?: string[], roundSeed?: number) => string | null;
  trimCompletedRounds?: boolean;
};

const GAME_MODULES: Partial<Record<GameId, GameModule>> = {
  "city-explorer": cityExplorer,
};

// ── Inline rules for games not yet migrated ────────────────────────────

const GAME_RULES: Partial<Record<GameId, string>> = {
  "palestine-quiz": `## Game: Palestine Quiz 🧠
You are playing a quiz game about Palestine.

### How to Play:
1. Ask a question about Palestine
2. Use present_options to show choices (without numbers — the UI adds them)
3. Wait for the player's answer (they will send the exact text of the option they chose)
4. Use check_answer to evaluate the answer
5. If the player asks for a hint or presses the hint button, use give_hint
6. After all questions are done, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Question Topics:
- Palestinian cities and their locations
- Palestinian food
- Heritage and culture
- Beautiful history
- Geography`,

  "story-builder": `## Game: Story Builder 📖
You build a story about Palestine with the player! Each one adds a part.

### How to Play:
1. Start the story with one or two sentences about Palestine
2. Ask the player to add the next part
3. Continue the story based on their addition
4. Use advance_round after each turn
5. After 8 rounds, end the story and use end_game

### Story Topics:
- Adventures in Palestinian cities
- Stories about food and cooking
- Tales about nature and olive trees`,

  "cultural-detective": `## Game: Heritage Detective 🔍
You describe an element of Palestinian heritage and the player must guess.

### How to Play:
1. Describe something from heritage (thobe/traditional dress, dabke, keffiyeh, etc.) with gradual hints
2. Use present_options to show choices (without numbers)
3. Wait for the player's answer (they will send the exact text of the option they chose)
4. Use check_answer to evaluate
5. If the player asks for a hint or presses the hint button, use give_hint
6. After 8 items, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.`,

  "time-traveler": `## Game: Time Traveler ⏰
You describe a Palestinian historical period and the player must guess the place or time.

### How to Play:
1. Describe a scene from a historical period (positive only!)
2. Ask: "Where am I?" or "When am I?"
3. Use present_options to show choices (without numbers)
4. Wait for the player's answer (they will send the exact text of the option they chose)
5. Use check_answer to evaluate
6. Use image_search to show images from that period
7. After 6 trips, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Allowed periods (positive only):
- Old Jerusalem and its markets
- Jaffa and its famous oranges
- Nablus and soap-making
- Traditional festivals and holidays (mawasim)`,

  "word-chain": `## Game: Word Chain 🔗
A word game! Each word must start with the last letter of the previous word.

### How to Play:
1. Start with a Palestinian-related word
2. The player says a word starting with the last letter
3. Use check_answer: correct if the word starts with the right letter and is an Arabic word
4. You continue with a new word
5. The game is continuous! Use end_game when the player says "enough" or after 20 words`,

  "twenty-questions": `## Game: 20 Questions ❓
You think of something Palestinian and the player has 20 questions to guess.

### How to Play:
1. Choose something Palestinian (food, city, tradition, etc.)
2. Say: "I'm thinking of something Palestinian... you have 20 questions!"
3. Answer the player's questions with only "Yes!" or "No!"
4. Use check_answer when they guess
5. If they guess correctly or questions run out, use end_game`,

  riddles: `## Game: Riddles and Puzzles 🤔
You tell Palestinian riddles and puzzles!

### How to Play:
1. Tell a Palestinian riddle or puzzle
2. Use present_options to show choices (without numbers)
3. Wait for the player's answer (they will send the exact text of the option they chose)
4. Use check_answer to evaluate
5. If the player asks for a hint or presses the hint button, use give_hint
6. After 8 riddles, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.`,

  "emoji-puzzle": `## Game: Emoji Puzzle 🧩
You show a group of emojis representing something Palestinian and the player must guess.

### How to Play:
1. Show a large emoji group (e.g.: 🧀🍯🟠 = ?)
2. Use present_options to show choices (without numbers)
3. Wait for the player's answer (they will send the exact text of the option they chose)
4. Use check_answer to evaluate
5. If the player asks for a hint or presses the hint button, use give_hint
6. After 10 puzzles, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.
### Important: Display emojis large and clear!`,

  "memory-match": `## Game: Memory Match 🃏
A memory game! You show pairs and hide them, the player must remember.

### How to Play:
1. Show 6 Palestinian pairs (city + its food, etc.) briefly
2. Ask: "Where is the matching pair?"
3. Use present_options to show choices (without numbers)
4. The player chooses a pair (they will send the exact text of the option they chose)
5. Use check_answer: correct if they match
6. After finding all pairs, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Suggested Pairs:
- Nablus (نابلس) ↔ Knafeh (كنافة)
- Jerusalem (القدس) ↔ Al-Aqsa Mosque (المسجد الأقصى)
- Jaffa (يافا) ↔ Oranges (برتقال)
- Hebron (الخليل) ↔ Grapes (عنب)
- Gaza (غزة) ↔ Sea (بحر)
- Bethlehem (بيت لحم) ↔ Church of the Nativity (كنيسة المهد)`,

  "draw-describe": `## Game: Draw & Describe 🎨
You describe something Palestinian and the player "draws" it with words or describes it!

### How to Play:
1. Choose a Palestinian element (thobe, mosque, olive tree, etc.)
2. Ask the player to describe it or say what they see
3. Encourage details
4. Use advance_round after each description
5. After 5 rounds, use end_game`,

  "recipe-chef": `## Game: Palestine Chef 👨‍🍳
You teach the player to cook a Palestinian dish step by step!

### How to Play:
1. Use present_options to show dish choices (without numbers)
2. The player chooses (they will send the exact text of the option they chose)
3. Give the ingredients in a fun way
4. Each step = a round, use present_options for the next step choices
5. Use advance_round after each step
6. After the dish is done, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Suggested Dishes:
- Maqloubeh (مقلوبة) 🍲
- Knafeh (كنافة) 🍰
- Falafel (فلافل) 🧆
- Musakhan (مسخن) 🍗
- Hummus (حمص) 🫘`,

  "would-you-rather": `## Game: Would You Rather? 🤷
You give two fun Palestinian options and the player chooses!

### How to Play:
1. Present the question in text
2. Use present_options with two choices (without numbers — the UI adds them)
3. The player chooses (they will send the exact text of the option they chose)
4. Comment on their choice with a fun fact
5. Use advance_round after each question
6. After 8 questions, use end_game

### Important: When the player responds, they will send the exact text of the option they selected, not a number.

### Each choice must be:
- Fun and funny
- Related to Palestine
- With an educational fun fact after choosing`,
};

/**
 * Check if a game opts in to server-side message trimming.
 */
export function shouldTrimMessages(gameId: GameId): boolean {
  return GAME_MODULES[gameId]?.trimCompletedRounds === true;
}

// ── Orchestrator ───────────────────────────────────────────────────────

/**
 * Build the full system prompt for a specific game session.
 */
export function buildGameSystemPrompt(
  gameId: GameId,
  difficulty?: GameDifficulty,
  chatContext?: KidsChatContext,
  age?: number,
  playerName?: string,
  usedDataIds?: string[],
  roundSeed?: number
): string {
  const config = getGameConfig(gameId);
  const parts: string[] = [];

  // 1. Base character
  parts.push(MEDHAT_BASE);

  // 2. Game rules — from per-game module or inline fallback
  const mod = GAME_MODULES[gameId];
  if (mod) {
    parts.push(mod.RULES);
  } else {
    const inlineRules = GAME_RULES[gameId];
    if (inlineRules) parts.push(inlineRules);
  }

  // 3. Per-game data (e.g. one city for city-explorer, excluding already-used ones)
  if (mod?.getData) {
    const data = mod.getData(usedDataIds, roundSeed);
    if (data) parts.push(data);
  }

  // 4. Difficulty calibration (age-aware complexity)
  if (difficulty && config.hasDifficulty) {
    parts.push(buildDifficultySection(difficulty, age || 8));
  }

  // 5. Age adaptation (detailed, age-calibrated rules)
  if (age) {
    parts.push(buildAgeAdaptationSection(age));
  }

  // 6. Player name personalization
  if (playerName) {
    parts.push(buildPlayerNameSection(playerName));
  }

  // 7. Chat context
  if (chatContext?.recentTopics?.length) {
    parts.push(buildChatContextSection(chatContext));
  }

  // 8. Game metadata
  parts.push(buildGameMetadataSection(config));

  // 9. Safety rules
  parts.push(SAFETY_RULES);

  // 10. present_options instruction
  if (GAMES_WITH_OPTIONS.includes(gameId)) {
    parts.push(PRESENT_OPTIONS_RULES);
  }

  // 11. Quick reply suggestions (for free-form games)
  if (GAMES_WITH_SUGGEST_REPLIES.includes(gameId)) {
    parts.push(buildSuggestRepliesRules(age || 8));
  }

  // 12. Tool usage rules
  parts.push(TOOL_USAGE_RULES);

  return parts.join("\n\n");
}
