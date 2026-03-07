import OpenAI from "openai";
import { createOpenAI } from "@ai-sdk/openai";

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
 * Get or create OpenAI client instance (native SDK — used by TTS)
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
 * Singleton AI SDK providers (Vercel AI SDK — used by chat, games, stories)
 */
let openaiProvider: ReturnType<typeof createOpenAI> | null = null;
let openrouterProvider: ReturnType<typeof createOpenAI> | null = null;

function getOpenAIProvider(): ReturnType<typeof createOpenAI> {
  if (openaiProvider) return openaiProvider;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  openaiProvider = createOpenAI({ apiKey });
  return openaiProvider;
}

function getOpenRouterProvider(): ReturnType<typeof createOpenAI> {
  if (openrouterProvider) return openrouterProvider;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  openrouterProvider = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  return openrouterProvider;
}

/**
 * Returns the active AI provider based on AI_PROVIDER env var.
 * "openrouter" → OpenRouter, anything else → OpenAI (default)
 */
export function getAIProvider(): ReturnType<typeof createOpenAI> {
  return process.env.AI_PROVIDER === "openrouter"
    ? getOpenRouterProvider()
    : getOpenAIProvider();
}

// ── Per-feature model getters ─────────────────────────────────────────────────

const isOpenRouter = () => process.env.AI_PROVIDER === "openrouter";

export function getMainChatModel(): string {
  return isOpenRouter()
    ? process.env.MAIN_CHAT_MODEL_OR || "google/gemini-2.0-flash-001"
    : process.env.MAIN_CHAT_MODEL || "gpt-5-mini";
}

export function getCityExploreModel(): string {
  return isOpenRouter()
    ? process.env.CITY_EXPLORE_MODEL_OR || "google/gemini-2.0-flash-001"
    : process.env.CITY_EXPLORE_MODEL || "gpt-5-mini";
}

export function getStoriesModel(): string {
  return isOpenRouter()
    ? process.env.STORIES_MODEL_OR || "google/gemini-2.0-flash-001"
    : process.env.STORIES_MODEL || "gpt-5-mini";
}

/**
 * Alias for main chat model — kept for backwards compatibility (TTS, etc.)
 */
export function getModel(): string {
  return getMainChatModel();
}

/**
 * Check if streaming is enabled
 */
export function isStreamingEnabled(): boolean {
  return process.env.ENABLE_STREAMING !== "false"; // Default: enabled
}
