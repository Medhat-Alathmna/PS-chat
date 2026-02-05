import { ImageResult, ToolResult } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";

/**
 * Search for high-quality images using Pexels API
 * Requires PEXELS_API_KEY environment variable
 */
export async function searchPexels(
  query: string,
  limit: number = 3
): Promise<ToolResult<ImageResult[]>> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Pexels API key not configured" };
  }

  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { success: false, error: "Query is empty" };
  }

  try {
    const url = new URL(PEXELS_ENDPOINT);
    url.searchParams.set("query", trimmedQuery);
    url.searchParams.set("per_page", String(Math.min(limit, 80)));
    url.searchParams.set("orientation", "landscape");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      logError("pexels-search", `Request failed with status ${response.status}`);
      return { success: false, error: `Pexels API returned ${response.status}` };
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      return { success: true, data: [] };
    }

    const images: ImageResult[] = data.photos.slice(0, limit).map((photo: any) => ({
      id: String(photo.id),
      title: photo.alt || "Pexels Photo",
      imageUrl: photo.src.large,
      thumbnailUrl: photo.src.medium,
      source: "pexels",
      creator: photo.photographer,
      detailUrl: photo.url,
      license: "Pexels License",
      licenseUrl: "https://www.pexels.com/license/",
    }));

    return { success: true, data: images };
  } catch (error) {
    logError("pexels-search", error);
    return { success: false, error: String(error) };
  }
}
