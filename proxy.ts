import { NextRequest, NextResponse } from "next/server";

/** Always accessible — API routes, static assets, verify-email (works in any auth state) */
const ALWAYS_PUBLIC = [
  "/auth/verify-email",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/google",          // includes /callback sub-path
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/_next",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  "/og-image.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

/** Auth pages — only for unauthenticated users; authenticated users are redirected to /kids */
const GUEST_ONLY_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isAlwaysPublic(pathname: string): boolean {
  return ALWAYS_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

function isGuestOnly(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Decode JWT exp without verifying signature */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return true;
  return Date.now() / 1000 > exp;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken  = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // 1. Always-public paths (API routes, static assets, verify-email)
  if (isAlwaysPublic(pathname)) return NextResponse.next();

  // 2. Guest-only pages: authenticated users are redirected to the app
  if (isGuestOnly(pathname)) {
    const hasSession = (accessToken && !isExpired(accessToken)) || !!refreshToken;
    if (hasSession) return NextResponse.redirect(new URL("/kids", req.url));
    return NextResponse.next();
  }

  // 3. Protected routes — require a valid session
  if (!accessToken && !refreshToken) return redirectToLogin(req);

  if (accessToken && !isExpired(accessToken)) return NextResponse.next();

  // Access token expired — try refresh
  if (refreshToken) {
    const refreshRes = await fetch(
      new URL("/api/auth/refresh", req.url).toString(),
      { method: "POST", headers: { cookie: req.headers.get("cookie") ?? "" } }
    );

    if (refreshRes.ok) {
      // Forward the new Set-Cookie headers from the refresh response
      const response = NextResponse.next();
      refreshRes.headers.getSetCookie().forEach((cookie) => {
        response.headers.append("Set-Cookie", cookie);
      });
      return response;
    }
  }

  // Refresh failed → send to login
  return redirectToLogin(req);
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  const res = NextResponse.redirect(loginUrl);
  // Clear stale cookies
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder assets (e.g. images, fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ogg|mp3|wav|mp4|webm|ico|woff2?|ttf|otf)$).*)",
  ],
};
