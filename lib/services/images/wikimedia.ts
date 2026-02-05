import { ImageResult, ToolResult } from "@/lib/types";
import { logError } from "@/lib/utils/error-handler";

const WIKIMEDIA_ENDPOINT = "https://commons.wikimedia.org/w/api.php";

/**
 * Search for images using Wikimedia Commons API
 * Perfect for historical Palestinian places and landmarks
 */
export async function searchWikimedia(
  query: string,
  limit: number = 3
): Promise<ToolResult<ImageResult[]>> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { success: false, error: "Query is empty" };
  }

  try {
    const url = new URL(WIKIMEDIA_ENDPOINT);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", trimmedQuery);
    url.searchParams.set("gsrlimit", String(Math.min(limit, 10)));
    url.searchParams.set("gsrnamespace", "6"); // File namespace
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|extmetadata");
    url.searchParams.set("iiurlwidth", "400");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PS-chat/1.0 (Palestine Chat App)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      logError("wikimedia-search", `Request failed with status ${response.status}`);
      return { success: false, error: `Wikimedia API returned ${response.status}` };
    }

    const data = await response.json();

    if (!data.query?.pages) {
      return { success: true, data: [] };
    }

    const pages = Object.values(data.query.pages) as any[];
    const images: ImageResult[] = pages
      .filter((page) => page.imageinfo && page.imageinfo.length > 0)
      .slice(0, limit)
      .map((page) => {
        const imageInfo = page.imageinfo[0];
        const metadata = imageInfo.extmetadata || {};

        return {
          id: String(page.pageid),
          title: metadata.ObjectName?.value || page.title?.replace("File:", "") || "Untitled",
          imageUrl: imageInfo.url || "",
          thumbnailUrl: imageInfo.thumburl || imageInfo.url || "",
          source: "wikimedia",
          creator: metadata.Artist?.value || metadata.Credit?.value,
          license: metadata.LicenseShortName?.value || "Wikimedia Commons",
          licenseUrl: metadata.LicenseUrl?.value,
          detailUrl: imageInfo.descriptionurl,
        };
      });

    return { success: true, data: images };
  } catch (error) {
    logError("wikimedia-search", error);
    return { success: false, error: String(error) };
  }
}
