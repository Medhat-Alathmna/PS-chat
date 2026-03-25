import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

type Params = { params: Promise<{ id: string }> };

async function getToken() {
  const token = await getAccessToken();
  if (!token) return null;
  return token;
}

export async function GET(req: NextRequest, { params }: Params) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profileId = req.headers.get("x-profile-id");
    const settings = await backendFetch(`/profiles/${id}/settings`, {
      accessToken,
      headers: profileId ? { "X-Profile-Id": profileId } : {},
    });
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profileId = req.headers.get("x-profile-id");
    const body = await req.json();
    const settings = await backendFetch(`/profiles/${id}/settings`, {
      accessToken,
      method: "PATCH",
      body: JSON.stringify(body),
      headers: profileId ? { "X-Profile-Id": profileId } : {},
    });
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
