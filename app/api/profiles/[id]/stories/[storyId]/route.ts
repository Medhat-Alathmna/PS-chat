import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/api/cookies";
import { backendFetch, BackendError } from "@/lib/api/backend";

type Params = { params: Promise<{ id: string; storyId: string }> };

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
    const { id, storyId } = await params;
    const story = await backendFetch(`/profiles/${id}/stories/${storyId}`, {
      accessToken,
    });
    return NextResponse.json(story);
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
    const { id, storyId } = await params;
    const body = await req.json();

    // Strip base64 data URLs from pages before sending to backend
    // (base64 images can be 100-500KB each, too large for JSONB)
    if (body.pages && Array.isArray(body.pages)) {
      body.pages = body.pages.map((p: Record<string, unknown>) => ({
        ...p,
        imageUrl:
          typeof p.imageUrl === "string" && p.imageUrl.startsWith("data:")
            ? undefined
            : p.imageUrl,
      }));
    }

    const story = await backendFetch(`/profiles/${id}/stories/${storyId}`, {
      accessToken,
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(story);
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const accessToken = await getToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id, storyId } = await params;
    await backendFetch(`/profiles/${id}/stories/${storyId}`, {
      accessToken,
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json(err.body, { status: err.status });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
