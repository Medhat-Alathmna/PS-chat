import { tool } from "ai";
import { z } from "zod";
import { GameId } from "@/lib/types/games";
import { imageSearchTool, locationSearchTool } from "./tools";

/**
 * check_answer — AI declares correct/incorrect with explanation
 */
export const checkAnswerTool = tool({
  description:
    "Use this tool to evaluate the player's answer. Declare if it's correct or incorrect, provide a brief explanation, and optionally share a fun fact.",
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
 * give_hint — AI provides a progressive hint
 */
export const giveHintTool = tool({
  description:
    "Use this tool to give the player a hint. Hints should be progressive (first hint is vague, second more specific).",
  inputSchema: z.object({
    hint: z.string().describe("The hint text in Palestinian Arabic"),
    hintNumber: z.number().describe("Which hint this is (1, 2, 3...)"),
    pointsDeduction: z.number().describe("Points deducted for using this hint"),
  }),
  execute: async ({ hint, hintNumber, pointsDeduction }) => {
    return { hint, hintNumber, pointsDeduction };
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
  end_game: endGameTool,
};

const creativeTools: ToolCollection = {
  advance_round: advanceRoundTool,
  end_game: endGameTool,
};

const explorerTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  end_game: endGameTool,
  image_search: imageSearchTool,
  location_search: locationSearchTool,
};

const wordGameTools: ToolCollection = {
  check_answer: checkAnswerTool,
  give_hint: giveHintTool,
  end_game: endGameTool,
};

/**
 * Get the right set of tools for a given game
 */
export function getToolsForGame(gameId: GameId): ToolCollection {
  switch (gameId) {
    // Educational games with rich media
    case "city-explorer":
    case "time-traveler":
      return explorerTools;

    // Quiz-style games
    case "palestine-quiz":
    case "cultural-detective":
    case "riddles":
    case "emoji-puzzle":
    case "memory-match":
    case "twenty-questions":
      return quizTools;

    // Word games
    case "word-chain":
      return wordGameTools;

    // Creative games
    case "story-builder":
    case "draw-describe":
    case "recipe-chef":
    case "would-you-rather":
      return creativeTools;

    default:
      return quizTools;
  }
}
