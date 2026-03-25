"use server";

import { NextRequest } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/api/cookies";

/**
 * POST /api/world-explorer/chat — thin proxy to NestJS POST /ai/world-explorer/chat
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const body = await req.json();
    const profileId = req.headers.get("x-profile-id");

    const result = await backendFetch("/ai/world-explorer/chat", {
      method: "POST",
      body: JSON.stringify(body),
      accessToken,
      headers: profileId ? { "X-Profile-Id": profileId } : {},
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json(error.body, { status: error.status });
    }
    return Response.json(
      { error: "حدث خطأ. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
