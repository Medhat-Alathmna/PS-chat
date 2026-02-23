import { tool } from "ai";
import { z } from "zod";

/**
 * story_page — AI outputs a single story page
 */
export const storyPageTool = tool({
  description:
    "Output a single story page. Each page should have 5-6 lines of MSA Arabic text. Call this tool once per page.",
  inputSchema: z.object({
    pageNumber: z.number().describe("The page number (starting from 1)"),
    text: z.string().describe("The story text for this page in MSA Arabic (5-6 lines)"),
    isLastPage: z.boolean().describe("Whether this is the final page of the story"),
  }),
  execute: async ({ pageNumber, text, isLastPage }) => {
    return { pageNumber, text, isLastPage };
  },
});

/**
 * story_choice — Present 2-3 interactive path choices
 */
export const storyChoiceTool = tool({
  description:
    "Present 2-3 path choices for the child to pick from. The story PAUSES here and waits for the child's selection before continuing. Use this after every 2-3 story pages to keep the child engaged.",
  inputSchema: z.object({
    prompt: z.string().describe("A question or prompt asking the child what should happen next, in MSA Arabic"),
    choices: z
      .array(
        z.object({
          id: z.string().describe("Unique choice identifier (e.g. 'choice_1')"),
          emoji: z.string().describe("An emoji representing this choice"),
          textAr: z.string().describe("The choice text in MSA Arabic (short, 5-10 words)"),
        })
      )
      .min(2)
      .max(3)
      .describe("2-3 path choices for the child"),
  }),
  execute: async ({ prompt, choices }) => {
    return { prompt, choices, waitingForChoice: true };
  },
});

/**
 * end_story — Conclude the story
 */
export const endStoryTool = tool({
  description:
    "End the story with a title and closing message. Call this after the final story_page.",
  inputSchema: z.object({
    titleAr: z
      .string()
      .describe("A creative Arabic title for the story (3-6 words)"),
    closingMessage: z
      .string()
      .describe("A warm closing message for the child in MSA Arabic"),
    totalPages: z.number().describe("Total number of pages in the story"),
  }),
  execute: async ({ titleAr, closingMessage, totalPages }) => {
    return { titleAr, closingMessage, totalPages };
  },
});

/**
 * Build story tools — returns Record<string, any> per project convention.
 * In continuous mode, story_choice is excluded to save tokens.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildStoryTools(interactive: boolean = true): Record<string, any> {
  if (interactive) {
    return {
      story_page: storyPageTool,
      story_choice: storyChoiceTool,
      end_story: endStoryTool,
    };
  }
  return {
    story_page: storyPageTool,
    end_story: endStoryTool,
  };
}
