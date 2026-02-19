import OpenAI from "openai";

/**
 * AI Configuration - Shared Utilities
 * 
 * This file contains only shared configuration utilities.
 * For system prompts, use the dedicated modules:
 * - Main chat: lib/ai/main
 * - Kids chat: lib/ai/kids
 * - Games: lib/ai/games
 */

/**
 * Get or create OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Get the model to use for chat
 */
export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}

/**
 * Check if streaming is enabled
 */
export function isStreamingEnabled(): boolean {
  return process.env.ENABLE_STREAMING !== "false"; // Default: enabled
}