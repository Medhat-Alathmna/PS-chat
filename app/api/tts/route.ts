"use server";

import { NextRequest } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

/**
 * POST /api/tts — thin proxy to NestJS POST /ai/tts
 * Uses raw fetch (not backendFetch) to preserve binary audio stream.
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const body = await req.json();

    const profileId = req.headers.get("x-profile-id");

    const backendRes = await fetch(`${BACKEND_URL}/api/ai/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(profileId ? { "X-Profile-Id": profileId } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const err = await backendRes.json().catch(() => ({ error: "TTS failed" }));
      return Response.json(err, { status: backendRes.status });
    }

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return Response.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
