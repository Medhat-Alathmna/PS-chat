import { NextRequest, NextResponse } from "next/server";

/** Routes that are accessible without authentication */
const PUBLIC_PATHS = [
  "/auth/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/google",          // includes /callback sub-path
  "/_next",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
  "/og-image.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
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

  // Always allow public paths
  if (isPublic(pathname)) return NextResponse.next();

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // No tokens at all → redirect to login
  if (!accessToken && !refreshToken) {
    return redirectToLogin(req);
  }

  // Valid access token → proceed
  if (accessToken && !isExpired(accessToken)) {
    return NextResponse.next();
  }

  // Access token missing or expired — try refresh
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
