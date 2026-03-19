import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendError, TokensResponse } from "@/lib/api/backend";
import { setAuthCookies } from "@/lib/api/cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokens = await backendFetch<TokensResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
