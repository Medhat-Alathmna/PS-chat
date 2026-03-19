import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

interface BackendProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  color: string;
  createdAt: string;
}

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
    const profile = await backendFetch<BackendProfile>(`/profiles/${id}`, { accessToken });
    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const profile = await backendFetch<BackendProfile>(`/profiles/${id}`, {
      accessToken,
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await backendFetch(`/profiles/${id}`, { accessToken, method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
