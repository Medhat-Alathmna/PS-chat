import { ToolResult, Coordinates } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

type WikiCoords = { lat: number; lng: number; title: string };

function extractCoordsFromPages(pages: Record<string, unknown>): WikiCoords | null {
  for (const page of Object.values(pages) as Record<string, unknown>[]) {
    const coords = (page as { coordinates?: { lat: number; lon: number }[] }).coordinates;
    if (coords && coords.length > 0) {
      return { lat: coords[0].lat, lng: coords[0].lon, title: page.title as string };
    }
  }
  return null;
}

async function fetchWikipediaCoords(
  params: Record<string, string>,
  lang: "en" | "ar"
): Promise<WikiCoords | null> {
  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "coordinates");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Palestine-Chat/1.0 (Educational App)" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;

    return extractCoordsFromPages(pages);
  } catch {
    return null;
  }
}

async function searchWikipediaCoords(
  query: string,
  lang: "en" | "ar"
): Promise<WikiCoords | null> {
  // 1. Direct title lookup — fastest, works when query matches article title
  const direct = await fetchWikipediaCoords({ titles: query }, lang);
  if (direct) return direct;

  // 2. Full-text search fallback — handles partial names, transliterations, etc.
  return fetchWikipediaCoords(
    { generator: "search", gsrsearch: query, gsrlimit: "3" },
    lang
  );
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
