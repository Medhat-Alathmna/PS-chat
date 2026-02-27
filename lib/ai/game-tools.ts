import { tool } from "ai";
import { z } from "zod";
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
 * give_hint — AI provides a single hint, optionally with images
 * Points deduction based on difficulty (Easy=0, Medium=1, Hard=2)
 * IMPORTANT: Always call this tool with present_options in the same response!
 */
export const giveHintTool = tool({
  description:
    "Use this tool to provide a hint for the current question. ALWAYS call this together with present_options in the SAME response. The hint will be hidden until the player requests it. Points deduction: Easy=0 (free!), Medium=1, Hard=2.",
  inputSchema: z.object({
    hint: z.string().describe("The hint text in Palestinian Arabic - should help without giving away the answer directly"),
    pointsDeduction: z.number().describe("Points deducted for using this hint: Easy=0, Medium=1, Hard=2 (system calculates based on difficulty)"),
    imageQuery: z.string().optional().describe("Optional search query to find a relevant image for this hint. MUST include the city/place name for relevant results! (e.g. 'كنافة نابلسية', 'المسجد الأقصى القدس', 'برتقال يافا'). Use specific landmark names, not generic descriptions."),
  }),
  execute: async ({ hint, pointsDeduction, imageQuery }) => {
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
    return { hint, pointsDeduction, images };
  },
});

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
