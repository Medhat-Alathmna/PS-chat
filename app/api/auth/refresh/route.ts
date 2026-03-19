import { NextResponse } from "next/server";
import { backendFetch, BackendError, TokensResponse } from "@/lib/api/backend";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/api/cookies";

export async function POST() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  try {
    const tokens = await backendFetch<TokensResponse>("/auth/refresh", {
      method: "POST",
      // Refresh endpoint uses the refresh token as Bearer
      accessToken: refreshToken,
    });

    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    await clearAuthCookies();
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
  }
}
