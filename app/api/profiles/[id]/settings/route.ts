import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

type Params = { params: Promise<{ id: string }> };

async function getToken() {
  const token = await getAccessToken();
  if (!token) return null;
  return token;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const settings = await backendFetch(`/profiles/${id}/settings`, { accessToken });
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
    const body = await req.json();
    const settings = await backendFetch(`/profiles/${id}/settings`, {
      accessToken,
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
