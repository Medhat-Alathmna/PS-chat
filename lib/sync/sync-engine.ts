/**
 * Sync engine — handles POST to /api/sync/import with retry and concurrency guard.
 * Pure utility, no React dependencies.
 */

import type { SyncImportPayload } from "./collect-sync-data";

export interface SyncResult {
  success: boolean;
  status?: number;
  error?: string;
}

// ── Concurrency & cooldown ──

let _syncing = false;
let _lastSyncAt = 0;
const COOLDOWN_MS = 30_000; // 30 seconds

export function isSyncing(): boolean {
  return _syncing;
}

export function lastSyncTime(): number {
  return _lastSyncAt;
}

export function cooldownElapsed(): boolean {
  return Date.now() - _lastSyncAt >= COOLDOWN_MS;
}

// ── Core ──

async function postSync(payload: SyncImportPayload): Promise<SyncResult> {
  const res = await fetch("/api/sync/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    return { success: true, status: res.status };
  }

  // 401 — try token refresh then retry once
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshRes.ok) {
      const retry = await fetch("/api/sync/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (retry.ok) {
        return { success: true, status: retry.status };
      }
      return { success: false, status: retry.status, error: "Retry after refresh failed" };
    }
    return { success: false, status: 401, error: "Token refresh failed" };
  }

  // 4xx (non-401) — don't retry, payload is deterministic
  if (res.status >= 400 && res.status < 500) {
    const body = await res.text().catch(() => "");
    return { success: false, status: res.status, error: body || `Client error ${res.status}` };
  }

  // 5xx — throw so caller can retry
  throw new Error(`Server error ${res.status}`);
}

/**
 * Execute sync with retry for server errors.
 * Returns immediately if another sync is in-flight or cooldown hasn't elapsed.
 */
export async function executeSyncImport(
  payload: SyncImportPayload
): Promise<SyncResult> {
  if (_syncing) {
    return { success: false, error: "Sync already in progress" };
  }
  if (!cooldownElapsed()) {
    return { success: false, error: "Cooldown not elapsed" };
  }

  _syncing = true;
  const retryDelays = [1000, 3000]; // 2 retries with backoff

  try {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        const result = await postSync(payload);
        if (result.success) {
          _lastSyncAt = Date.now();
        }
        return result;
      } catch (err) {
        // Server error — retry if attempts remain
        if (attempt < retryDelays.length) {
          await new Promise((r) => setTimeout(r, retryDelays[attempt]));
        } else {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }
    }
    return { success: false, error: "Exhausted retries" };
  } finally {
    _syncing = false;
  }
}
