import { randomUUID } from "crypto";
import { ImageResult, ToolResult, OpenverseResponse, OpenverseImage } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

const OPENVERSE_ENDPOINT = "https://api.openverse.engineering/v1/images/";

/**
 * Search for images using Openverse API
 */
export async function searchOpenverse(
  query: string,
  limit: number = 3
): Promise<ToolResult<ImageResult[]>> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { success: false, error: "Query is empty" };
  }

  const pageSize = Math.min(Math.max(limit, 1), 20);

  try {
    const url = new URL(OPENVERSE_ENDPOINT);
    url.searchParams.set("q", trimmedQuery);
    url.searchParams.set("page_size", String(pageSize));
    url.searchParams.set("license_type", "all");
    url.searchParams.set("exclude_sensitive_results", "true");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PS-chat/1.0 (+https://ps-chat.local)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      logError("openverse-search", `Request failed with status ${response.status}`);
      return { success: false, error: `Openverse API returned ${response.status}` };
    }

    const data = (await response.json()) as OpenverseResponse;

    if (!data.results?.length) {
      return { success: true, data: [] };
    }

    const images: ImageResult[] = data.results
      .filter((result: OpenverseImage) => Boolean(result.url))
      .slice(0, pageSize)
      .map((result: OpenverseImage) => ({
        id: result.id ?? randomUUID(),
        title: result.title ?? "Untitled image",
        imageUrl: result.url ?? "",
        thumbnailUrl: result.thumbnail ?? result.url ?? "",
        source: "openverse",
        attribution: result.attribution,
        license: result.license,
        licenseUrl: result.license_url,
        creator: result.creator,
        detailUrl: result.detail_url ?? result.foreign_landing_url,
      }));

    return { success: true, data: images };
  } catch (error) {
    logError("openverse-search", error);
    return { success: false, error: String(error) };
  }
}
