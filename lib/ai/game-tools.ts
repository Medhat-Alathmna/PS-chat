import { tool } from "ai";
import { z } from "zod";

/**
 * advance_round — Move to next round
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
