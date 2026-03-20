/**
 * Client-side games backend API.
 * All calls go through the /api/backend proxy which injects the JWT automatically.
 * Every function fails silently — localStorage is the source of truth.
 */

interface CreateSessionResult {
  id: string;
}

interface UpdateSessionData {
  score?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  hintsUsed?: number;
  status?: "playing" | "finished";
}

async function proxyFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    // Return a typed error so callers can inspect the status
    const error = new Error(`Backend ${res.status}`) as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/**
 * Create a new game session in the backend.
 * Returns the session ID or null if the call fails.
 */
export async function createGameSession(
  profileId: string,
  gameId: string,
  difficulty?: string
): Promise<string | null> {
  try {
    const body: Record<string, string> = {};
    if (difficulty) body.difficulty = difficulty;

    const result = await proxyFetch<CreateSessionResult>(
      `/profiles/${profileId}/games/${gameId}/sessions`,
      { method: "POST", body: JSON.stringify(body) }
    );
    return result?.id ?? null;
  } catch (err) {
    console.warn("[games-backend] createGameSession failed:", err);
    return null;
  }
}

/**
 * Update an existing game session (e.g. on game end).
 * Silently skips if session not found (404).
 */
export async function updateGameSession(
  profileId: string,
  sessionId: string,
  data: UpdateSessionData
): Promise<void> {
  try {
    await proxyFetch(`/profiles/${profileId}/games/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status !== 404) {
      console.warn("[games-backend] updateGameSession failed:", err);
    }
  }
}

/**
 * Mark a city as discovered for a profile.
 * Treats 409 (already discovered) as success.
 */
export async function discoverCityBackend(
  profileId: string,
  cityId: string
): Promise<void> {
  try {
    await proxyFetch(`/profiles/${profileId}/games/cities/${cityId}`, {
      method: "POST",
    });
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status !== 409) {
      console.warn("[games-backend] discoverCityBackend failed:", err);
    }
  }
}
