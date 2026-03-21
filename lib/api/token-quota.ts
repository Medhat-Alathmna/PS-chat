/**
 * Server-side token quota utilities for LLM API routes.
 * Checks and records token usage against the NestJS backend.
 */

import { backendFetch } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/api/cookies";

const BLOCKED_MESSAGE =
  "يا صديقي! لقد استخدمنا كل الرسائل المتاحة لنا. اطلب من والديك المساعدة!";

export interface QuotaCheckResult {
  allowed: boolean;
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

export interface QuotaResult {
  tokensUsed: number;
  tokenLimit: number;
  remaining: number;
}

/**
 * Pre-flight quota check before an LLM call.
 * Returns null if user is not authenticated.
 */
export async function checkTokenQuota(): Promise<QuotaCheckResult | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  return backendFetch<QuotaCheckResult>("/token-usage/check", { accessToken });
}

/**
 * Record token consumption after a successful LLM call.
 * Returns null if user is not authenticated.
 */
export async function recordTokenUsage(
  tokensUsed: number
): Promise<QuotaResult | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  return backendFetch<QuotaResult>("/token-usage/record", {
    accessToken,
    method: "POST",
    body: JSON.stringify({ tokensUsed }),
  });
}

// ── Route helpers ──────────────────────────────────────────────────────────

type QuotaGuardBlocked = { response: Response };
type QuotaGuardSuccess = { quota: QuotaCheckResult };

/**
 * Runs the pre-flight quota check and returns either a ready-to-return
 * error Response (401/429) or the current quota state.
 *
 * Usage:
 *   const result = await enforceQuota("chat");
 *   if ("response" in result) return result.response;
 *   const { quota } = result;
 */
export async function enforceQuota(
  routeLabel: string
): Promise<QuotaGuardBlocked | QuotaGuardSuccess> {
  let quota: QuotaCheckResult | null = null;
  try {
    quota = await checkTokenQuota();
  } catch (e) {
    console.warn(`[${routeLabel}] Quota check failed, proceeding:`, e);
  }
  if (quota === null) {
    return { response: Response.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 }) };
  }
  if (!quota.allowed) {
    return { response: Response.json({ blocked: true, message: BLOCKED_MESSAGE, quota }, { status: 429 }) };
  }
  return { quota };
}

/**
 * Records token usage after a successful LLM call.
 * Falls back to the original quota snapshot on error.
 */
export async function recordUsage(
  quota: QuotaCheckResult,
  tokens: number,
  routeLabel: string
): Promise<QuotaCheckResult> {
  try {
    const recorded = await recordTokenUsage(tokens);
    if (recorded) return { ...recorded, allowed: true };
  } catch (e) {
    console.warn(`[${routeLabel}] Token recording failed:`, e);
  }
  return quota;
}
