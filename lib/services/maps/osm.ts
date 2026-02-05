import { ToolResult, Coordinates } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

/**
 * Geocode a location using OpenStreetMap Nominatim API
 * Free and open-source alternative to Google Maps
 */
export async function geocodeWithOSM(
  location: string
): Promise<ToolResult<{ coordinates: Coordinates; formattedAddress: string }>> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", location);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Palestine-Chat/1.0 (Educational App)",
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return {
        success: false,
        error: `OSM API returned status ${response.status}`,
      };
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: `لم يتم العثور على "${location}"`,
      };
    }

    const result = data[0];

    return {
      success: true,
      data: {
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        },
        formattedAddress: result.display_name,
      },
    };
  } catch (error) {
    logError("osm-geocoding", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
