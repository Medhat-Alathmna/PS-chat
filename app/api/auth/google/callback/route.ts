import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/api/cookies";

/**
 * NestJS redirects here after Google OAuth completes:
 *   GET /api/auth/google/callback?access_token=...&refresh_token=...
 *
 * We set httpOnly cookies and redirect the user to /kids.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth_failed", req.url));
  }

  await setAuthCookies(accessToken, refreshToken);
  return NextResponse.redirect(new URL("/kids", req.url));
}
