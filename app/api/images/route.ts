import { NextRequest, NextResponse } from "next/server";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing query" },
        { status: 400 }
      );
    }

    const images = await searchImagesMultiSource(query, 4, true);
    return NextResponse.json({ success: true, images });
  } catch (e) {
    console.error("[kids/images] Error:", e);
    return NextResponse.json(
      { success: false, error: "Image search failed" },
      { status: 500 }
    );
  }
}
