import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

async function getToken() {
  const token = await getAccessToken();
  if (!token) return null;
  return token;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const stories = await backendFetch(`/profiles/${id}/stories`, { accessToken });
    return NextResponse.json(stories);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const story = await backendFetch(`/profiles/${id}/stories`, {
      accessToken,
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(story, { status: 201 });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
