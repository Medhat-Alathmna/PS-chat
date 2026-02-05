import { ImageResult, ToolResult } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/search/photos";

/**
 * Search for high-quality images using Unsplash API
 * Requires UNSPLASH_ACCESS_KEY environment variable
 */
export async function searchUnsplash(
  query: string,
  limit: number = 3
): Promise<ToolResult<ImageResult[]>> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    return { success: false, error: "Unsplash API key not configured" };
  }

  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { success: false, error: "Query is empty" };
  }

  try {
    const url = new URL(UNSPLASH_ENDPOINT);
    url.searchParams.set("query", trimmedQuery);
    url.searchParams.set("per_page", String(Math.min(limit, 30)));
    url.searchParams.set("orientation", "landscape");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
        "Accept-Version": "v1",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      logError("unsplash-search", `Request failed with status ${response.status}`);
      return { success: false, error: `Unsplash API returned ${response.status}` };
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return { success: true, data: [] };
    }

    const images: ImageResult[] = data.results.slice(0, limit).map((img: any) => ({
      id: img.id,
      title: img.description || img.alt_description || "Untitled",
      imageUrl: img.urls.regular,
      thumbnailUrl: img.urls.small,
      source: "unsplash",
      creator: img.user.name,
      detailUrl: img.links.html,
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    }));

    return { success: true, data: images };
  } catch (error) {
    logError("unsplash-search", error);
    return { success: false, error: String(error) };
  }
}
