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
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

// ── Provider singletons ───────────────────────────────────────────────────────

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

// ── Per-feature model instance getters ───────────────────────────────────────
// Each returns a ready-to-use provider(model) instance.
// Configure via .env.local — no code changes needed to switch providers or models.

function resolveFeature(
  providerEnv: string | undefined,
  modelEnv: string | undefined,
  modelOrEnv: string | undefined,
  defaultModel: string
) {
  const isOR = providerEnv === "openrouter";
  const provider = isOR ? getOpenRouterProvider() : getOpenAIProvider();
  const model = (isOR ? modelOrEnv : modelEnv) || defaultModel;
  return isOR ? provider.chat(model) : provider(model);
}

export function getMainChatModelInstance() {
  return resolveFeature(
    process.env.MAIN_CHAT_PROVIDER,
    process.env.MAIN_CHAT_MODEL,
    process.env.MAIN_CHAT_MODEL_OR,
    "gpt-5-mini"
  );
}

export function getCityExploreModelInstance() {
  return resolveFeature(
    process.env.CITY_EXPLORE_PROVIDER,
    process.env.CITY_EXPLORE_MODEL,
    process.env.CITY_EXPLORE_MODEL_OR,
    "gpt-5-mini"
  );
}

export function getStoriesModelInstance() {
  return resolveFeature(
    process.env.STORIES_PROVIDER,
    process.env.STORIES_MODEL,
    process.env.STORIES_MODEL_OR,
    "gpt-5-mini"
  );
}

export function getWorldExplorerModelInstance() {
  return resolveFeature(
    process.env.WORLD_EXPLORER_PROVIDER,
    process.env.WORLD_EXPLORER_MODEL,
    process.env.WORLD_EXPLORER_MODEL_OR,
    "gpt-5-mini"
  );
}

/**
 * @deprecated Use getMainChatModelInstance() instead.
 * Kept for any external callers that still use getAIProvider().
 */
export function getAIProvider(): ReturnType<typeof createOpenAI> {
  return getOpenAIProvider();
}

/**
 * @deprecated Use getMainChatModelInstance() instead.
 */
export function getModel(): string {
  return process.env.MAIN_CHAT_MODEL || "gpt-5-mini";
}

/**
 * Check if streaming is enabled
 */
export function isStreamingEnabled(): boolean {
  return process.env.ENABLE_STREAMING !== "false"; // Default: enabled
}
