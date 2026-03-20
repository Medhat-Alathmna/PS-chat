/**
 * Client-side helpers for the /api/profiles/:id/settings endpoint.
 *
 * fetchBackendSettings: deduplicates concurrent calls from the 4 settings hooks
 * that mount together on the settings page — only one HTTP GET fires per profileId.
 *
 * patchBackendSettings: sends a partial PATCH for a single category, with one
 * automatic retry after token refresh on 401.
 */

export interface BackendSettings {
  text?: Record<string, unknown>;
  map?: Record<string, unknown>;
  globe?: Record<string, unknown>;
  chat?: Record<string, unknown>;
}

// In-memory promise cache — 5 s TTL prevents duplicate GETs from concurrent hook mounts
const pendingFetches = new Map<string, Promise<BackendSettings | null>>();

export function fetchBackendSettings(
  profileId: string
): Promise<BackendSettings | null> {
  if (pendingFetches.has(profileId)) {
    return pendingFetches.get(profileId)!;
  }

  const p = fetch(`/api/profiles/${profileId}/settings`, {
    headers: { "Content-Type": "application/json" },
  })
    .then(async (res) => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
      return res.json() as Promise<BackendSettings>;
    })
    .catch(() => null) // degrade silently — hooks fall back to localStorage
    .finally(() =>
      setTimeout(() => pendingFetches.delete(profileId), 5000)
    );

  pendingFetches.set(profileId, p);
  return p;
}

export async function patchBackendSettings(
  profileId: string,
  category: "text" | "map" | "globe" | "chat",
  patch: Record<string, unknown>
): Promise<void> {
  const body = JSON.stringify({ [category]: patch });

  const res = await fetch(`/api/profiles/${profileId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (res.status === 401) {
    // Attempt token refresh then retry once
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshRes.ok) {
      await fetch(`/api/profiles/${profileId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      });
    }
    return;
  }

  if (!res.ok) {
    throw new Error(`Settings PATCH failed: ${res.status}`);
  }
}
