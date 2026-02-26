import { ToolResult, Coordinates } from "@/lib/types";
import { geocodeWithGoogle } from "./google-maps";
import { geocodeWithOSM } from "./osm";
import { geocodeWithWikipedia } from "./wikipedia";
import { logError } from "@/lib/utils/error-handler";

/**
 * Geocode a location with intelligent fallback
 * Tries Google Maps first (if API key available), falls back to OpenStreetMap
 */
export async function geocodeLocation(
  locationName: string
): Promise<ToolResult<{ coordinates: Coordinates; formattedAddress: string }>> {
  try {
    // Try Google Maps first if API key is available
    if (process.env.GOOGLE_MAPS_API_KEY) {
      const googleResult = await geocodeWithGoogle(locationName);

      if (googleResult.success) {
        return googleResult;
      }

      // Log Google Maps failure but continue to OSM
      console.warn(
        `[geocoding] Google Maps failed for "${locationName}", trying OSM`
      );
    }

    // Fallback to OpenStreetMap
    const osmResult = await geocodeWithOSM(locationName);

    if (osmResult.success) {
      return { ...osmResult, fallbackUsed: true };
    }

    // Last resort: Wikipedia — excellent coverage of Palestinian places including
    // depopulated 1948 villages, landmarks, mosques, and heritage sites
    const wikiResult = await geocodeWithWikipedia(locationName);

    if (wikiResult.success) {
      return { ...wikiResult, fallbackUsed: true };
    }

    return {
      success: false,
      error: `فشل في تحديد موقع "${locationName}"`,
    };
  } catch (error) {
    logError("geocoding", error);
    return {
      success: false,
      error: "حدث خطأ أثناء البحث عن الموقع",
    };
  }
}
