import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";
import { clearAuthCookies, getAccessToken } from "@/lib/api/cookies";

export async function POST() {
  const accessToken = await getAccessToken();

  // Best-effort: tell the backend to invalidate the session
  if (accessToken) {
    await backendFetch("/auth/logout", {
      method: "POST",
      accessToken,
    }).catch(() => {/* ignore — clear cookies regardless */});
  }

  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
