import { ToolResult, Coordinates } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

/**
 * Geocode a location using Google Maps Geocoding API
 * Requires GOOGLE_MAPS_API_KEY environment variable
 */
export async function geocodeWithGoogle(
  location: string
): Promise<ToolResult<{ coordinates: Coordinates; formattedAddress: string }>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Google Maps API key not configured",
    };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", location);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Google Maps API returned status ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return {
        success: false,
        error: data.error_message || `لم يتم العثور على "${location}"`,
      };
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return {
      success: true,
      data: {
        coordinates: { lat, lng },
        formattedAddress: result.formatted_address,
      },
    };
  } catch (error) {
    logError("google-maps-geocoding", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
