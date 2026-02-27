/**
 * Prompt Cache Helpers for OpenAI
 *
 * OpenAI offers 50% discount on cached input token prefixes (1024+ tokens).
 * These helpers add `providerOptions.openai.promptCacheKey` to streamText()
 * calls and format cache usage stats for logging.
 *
 * Toggle off via DISABLE_PROMPT_CACHE=true env var.
 */

/**
 * Returns providerOptions for prompt caching, or {} if disabled.
 * Spread into streamText(): `...buildCacheOptions("main-chat")`
 */
export function buildCacheOptions(cacheKey: string): {
  providerOptions?: { openai: { promptCacheKey: string } };
} {
  if (process.env.DISABLE_PROMPT_CACHE === "true") return {};
  return {
    providerOptions: {
      openai: { promptCacheKey: cacheKey },
    },
  };
}

/**
 * Extract and format cache usage stats from the AI SDK usage object.
 * Returns null if no cache data is present.
 */
export function formatCacheUsage(
  usage: Record<string, unknown> | undefined
): { cacheReadTokens: number; cacheWriteTokens: number; totalTokens: number } | null {
  if (!usage) return null;

  const providerMetadata = usage.providerMetadata as
    | Record<string, Record<string, unknown>>
    | undefined;
  const openaiMeta = providerMetadata?.openai;
  if (!openaiMeta) return null;

  const cacheRead = (openaiMeta.cachedPromptTokens as number) || 0;
  const cacheWrite =
    ((openaiMeta.promptTokens as number) || 0) - cacheRead;
  const total = (usage.totalTokens as number) || 0;

  return { cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite, totalTokens: total };
}
