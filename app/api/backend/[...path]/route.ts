/**
 * Generic authenticated proxy to NestJS backend.
 * Client calls /api/backend/profiles/123 → proxied to NestJS /api/profiles/123
 * with the access_token cookie injected as a Bearer header.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { path } = await params;
  const targetPath = path.join("/");
  const search = req.nextUrl.search;
  const url = `${BACKEND_URL}/api/${targetPath}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const profileId = req.headers.get("x-profile-id");
  if (profileId) headers["X-Profile-Id"] = profileId;

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer().then((b) => Buffer.from(b));
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const resContentType = upstream.headers.get("content-type") ?? "";
  if (resContentType.includes("application/json")) {
    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": resContentType || "text/plain" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
