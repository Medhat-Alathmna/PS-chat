import { ToolResult, Coordinates } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

async function searchWikipediaCoords(
  query: string,
  lang: "en" | "ar"
): Promise<{ lat: number; lng: number; title: string } | null> {
  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "3");
    url.searchParams.set("prop", "coordinates");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Palestine-Chat/1.0 (Educational App)" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    // Return first page that has coordinates
    for (const page of Object.values(pages) as Record<string, unknown>[]) {
      const coords = (page as { coordinates?: { lat: number; lon: number }[] }).coordinates;
      if (coords && coords.length > 0) {
        return { lat: coords[0].lat, lng: coords[0].lon, title: page.title as string };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Geocode using Wikipedia's search + coordinates API.
 * Excellent coverage of Palestinian places including depopulated villages,
 * landmarks, mosques, churches, natural sites — no API key required.
 */
export async function geocodeWithWikipedia(
  location: string
): Promise<ToolResult<{ coordinates: Coordinates; formattedAddress: string }>> {
  try {
    const arabic = isArabic(location);

    // Strip ", Palestine" suffix added by the tool layer — Wikipedia doesn't need it
    const cleanLocation = location.replace(/,?\s*(Palestine|فلسطين)$/i, "").trim();

    // Search Arabic Wikipedia first for Arabic queries, English Wikipedia first otherwise
    const primary = arabic ? "ar" : "en";
    const secondary = arabic ? "en" : "ar";

    // For English Wikipedia always add Palestine context to avoid ambiguous matches
    const enQuery = `${cleanLocation} Palestine`;
    const arQuery = cleanLocation;

    let result = await searchWikipediaCoords(primary === "ar" ? arQuery : enQuery, primary);

    if (!result) {
      result = await searchWikipediaCoords(secondary === "ar" ? arQuery : enQuery, secondary);
    }

    if (!result) {
      return { success: false, error: `لم يتم العثور على "${location}" في ويكيبيديا` };
    }

    return {
      success: true,
      data: {
        coordinates: { lat: result.lat, lng: result.lng },
        formattedAddress: result.title,
      },
    };
  } catch (error) {
    logError("wikipedia-geocoding", error);
    return { success: false, error: String(error) };
  }
}
