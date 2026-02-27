import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation } from "@/lib/services/maps/geocoding";

// Historic Palestine bounding box
const PALESTINE_BOUNDS = { minLat: 29.5, maxLat: 33.5, minLng: 34.2, maxLng: 35.9 };

function isInPalestine(lat: number, lng: number): boolean {
  return (
    lat >= PALESTINE_BOUNDS.minLat &&
    lat <= PALESTINE_BOUNDS.maxLat &&
    lng >= PALESTINE_BOUNDS.minLng &&
    lng <= PALESTINE_BOUNDS.maxLng
  );
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing query" },
        { status: 400 }
      );
    }

    const result = await geocodeLocation(query);
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false });
    }

    const { lat, lng } = result.data.coordinates;
    if (!isInPalestine(lat, lng)) {
      return NextResponse.json({ success: false, error: "Location is outside Palestine" });
    }

    return NextResponse.json({ success: true, coordinates: { lat, lng } });
  } catch (e) {
    console.error("[geocode] Error:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
