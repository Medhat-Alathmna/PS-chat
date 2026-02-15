import { tool } from "ai";
import { z } from "zod";
import { GameId } from "@/lib/types/games";
import { imageSearchTool, locationSearchTool } from "./tools";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";

/**
 * check_answer — AI declares correct/incorrect with explanation
 */
export const checkAnswerTool = tool({
  description:
    "Use this tool to evaluate the player's answer. Declare if it's correct or incorrect, provide a brief explanation, and optionally share a fun fact. IMPORTANT: If the player says 'مش عارف' or 'ما بعرف' or 'I don't know', do NOT use this tool — use give_hint instead to help them!",
  inputSchema: z.object({
    correct: z.boolean().describe("Whether the answer is correct"),
    explanation: z.string().describe("Brief explanation in Palestinian Arabic"),
    funFact: z.string().optional().describe("Optional fun fact to share"),
    pointsEarned: z.number().describe("Points earned for this answer (0 if wrong)"),
  }),
  execute: async ({ correct, explanation, funFact, pointsEarned }) => {
    return { correct, explanation, funFact, pointsEarned };
  },
});

/**
 * give_hint — AI provides a progressive hint, optionally with images
 * NEW: Points deduction based on difficulty (Easy=0, Medium=1, Hard=2)
 */
export const giveHintTool = tool({
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
        // Use kid-friendly mode for safe, cartoon-style images
        const results = await searchImagesMultiSource(imageQuery, 2, true);
        if (results.length > 0) {
          images = results;
        }
      } catch {
        // Silently skip images on failure
      }
    }
    return { hint, hintNumber, pointsDeduction, images };
  },
});

/**
 * advance_round — Move to next round (creative games)
 */
export const advanceRoundTool = tool({
  description:
    "Use this tool to move to the next round in the game. Used after the player completes a creative task or story contribution.",
  inputSchema: z.object({
    roundCompleted: z.number().describe("The round number just completed"),
    feedback: z.string().describe("Encouraging feedback on the player's contribution"),
    pointsEarned: z.number().describe("Points earned for this round"),
  }),
  execute: async ({ roundCompleted, feedback, pointsEarned }) => {
    return { roundCompleted, feedback, pointsEarned };
  },
});

/**
 * present_options — Show clickable numbered options in the UI
 */
export const presentOptionsTool = tool({
  description:
    "Present selectable options for the player. Call this EVERY time you ask a question with choices. The frontend renders numbered buttons the kid can tap.",
  inputSchema: z.object({
    options: z
      .array(z.string())
      .min(2)
      .max(6)
      .describe("Option texts without numbers — the frontend adds 1️⃣2️⃣3️⃣ automatically"),
    allowHint: z
      .boolean()
      .describe("Whether to show a hint button alongside the options"),
  }),
  execute: async ({ options, allowHint }) => {
    return { options, allowHint, displayed: true };
  },
});

/**
 * suggest_replies — Show tappable quick-reply chips for free-form games
 */
export const suggestRepliesTool = tool({
  description:
    "Suggest quick reply options the player can tap instead of typing. Use for free-form games to help kids who struggle with typing. These are soft suggestions, NOT quiz answers — use present_options for quiz answers.",
  inputSchema: z.object({
    suggestions: z
      .array(z.string())
      .min(2)
      .max(5)
      .describe("2-5 short Arabic suggestions the kid can tap"),
    showHintChip: z
      .boolean()
      .describe("Whether to include a hint chip alongside suggestions"),
  }),
  execute: async ({ suggestions, showHintChip }) => {
    return { suggestions, showHintChip, displayed: true };
  },
});

/**
 * end_game — Signal game over with reason and final message
 */
export const endGameTool = tool({
  description:
    "Use this tool to end the game. Call this when all rounds are done, or the player wants to stop.",
  inputSchema: z.object({
    reason: z
      .enum(["completed", "quit", "time_up"])
      .describe("Why the game ended"),
    finalMessage: z
      .string()
      .describe("Celebratory/encouraging final message in Palestinian Arabic"),
    totalScore: z.number().describe("The final total score"),
    correctAnswers: z.number().describe("Total correct answers"),
    totalRounds: z.number().describe("Total rounds played"),
  }),
  execute: async ({ reason, finalMessage, totalScore, correctAnswers, totalRounds }) => {
    return { reason, finalMessage, totalScore, correctAnswers, totalRounds };
  },
});

// ============================================
// TOOL COLLECTIONS PER GAME TYPE
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolCollection = Record<string, any>;

const quizTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  present_options: presentOptionsTool,
  end_game: endGameTool,
};

const explorerTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  present_options: presentOptionsTool,
  end_game: endGameTool,
  image_search: imageSearchTool,
  location_search: locationSearchTool,
};

/** City explorer — like explorer but NO location_search (map handles cities automatically) */
const cityExplorerTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  advance_round: advanceRoundTool,
  present_options: presentOptionsTool,
  end_game: endGameTool,
  image_search: imageSearchTool,
  suggest_replies: suggestRepliesTool,
};

/** Creative games WITH selectable options (would-you-rather, recipe-chef) */
const creativeToolsWithOptions: ToolCollection = {
  advance_round: advanceRoundTool,
  present_options: presentOptionsTool,
  suggest_replies: suggestRepliesTool,
  end_game: endGameTool,
};

/** Creative games WITHOUT options (story-builder, draw-describe) */
const creativeToolsNoOptions: ToolCollection = {
  advance_round: advanceRoundTool,
  suggest_replies: suggestRepliesTool,
  end_game: endGameTool,
};

/** Word games — free-form text input, no selectable options */
const wordGameTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  suggest_replies: suggestRepliesTool,
  end_game: endGameTool,
};

/**
 * Get the right set of tools for a given game
 */
export function getToolsForGame(gameId: GameId): ToolCollection {
  switch (gameId) {
    // City explorer — no location_search (map auto-handles cities)
    case "city-explorer":
      return cityExplorerTools;

    // Educational games with rich media + options
    case "time-traveler":
      return explorerTools;

    // Quiz-style games with options
    case "palestine-quiz":
    case "cultural-detective":
    case "riddles":
    case "emoji-puzzle":
    case "memory-match":
      return quizTools;

    // Free-form word games (no options)
    case "word-chain":
    case "twenty-questions":
      return wordGameTools;

    // Creative games WITH options
    case "would-you-rather":
    case "recipe-chef":
      return creativeToolsWithOptions;

    // Creative games WITHOUT options
    case "story-builder":
    case "draw-describe":
      return creativeToolsNoOptions;

    default:
      return quizTools;
  }
}
