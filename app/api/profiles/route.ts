import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

interface ProfilePayload {
  name: string;
  age: number;
  avatar: string;
  color: string;
}

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

export async function GET() {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const profiles = await backendFetch<BackendProfile[]>("/profiles", { accessToken });
    return NextResponse.json(profiles);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const body: ProfilePayload = await req.json();
    const profile = await backendFetch<BackendProfile>("/profiles", {
      accessToken,
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
