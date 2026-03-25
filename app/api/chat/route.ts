"use server";

import { NextRequest } from "next/server";
import { backendFetch, BackendError } from "@/lib/api/backend";
import { getAccessToken } from "@/lib/api/cookies";

/**
 * POST /api/chat — thin proxy to NestJS POST /ai/chat
 * Converts UIMessage[] → SimpleMessage[] before forwarding.
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const body = await req.json();
    const { messages = [], playerName, dialect } = body;
    const profileId = req.headers.get("x-profile-id");

    // UIMessage[] → SimpleMessage[] (last 3)
    const simple = (messages as any[]).slice(-3).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content:
        (m.parts ?? []).find((p: any) => p.type === "text")?.text ??
        m.content ??
        "",
    }));

    const result = await backendFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages: simple, playerName, dialect }),
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
