/**
 * Server-side only — DRY wrapper for NestJS backend calls.
 * All requests go through Next.js API routes (client never calls NestJS directly).
 *
 * Usage in API routes:
 *   import { backendFetch } from '@/lib/api/backend';
 *   const data = await backendFetch('/profiles', { accessToken, method: 'GET' });
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Backend responded with ${status}`);
  }
}

interface BackendFetchOptions extends Omit<RequestInit, 'headers'> {
  accessToken?: string;
  headers?: Record<string, string>;
}

export async function backendFetch<T = unknown>(
  path: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const { accessToken, headers = {}, ...rest } = options;

  const res = await fetch(`${BACKEND_URL}/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  // Parse body regardless of status (NestJS sends error details in JSON)
  let body: unknown;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (!res.ok) throw new BackendError(res.status, body);
  return body as T;
}

/** Typed response for NestJS /auth/login and /auth/register */
export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

/** Decode a JWT payload without verifying signature (server-side use only) */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}
