import { randomUUID } from "crypto";

const OPENVERSE_ENDPOINT = "https://api.openverse.engineering/v1/images/";

export type ImageSearchResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: string;
  attribution?: string;
  license?: string;
  licenseUrl?: string;
  creator?: string;
  detailUrl?: string;
};

type OpenverseImage = {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  provider?: string;
  source?: string;
  foreign_landing_url?: string;
  attribution?: string;
  license?: string;
  license_url?: string;
  creator?: string;
  detail_url?: string;
};

type OpenverseResponse = {
  results?: OpenverseImage[];
};

export async function searchImages(
  rawQuery: string,
  limit = 3
): Promise<ImageSearchResult[]> {
  const query = rawQuery.trim();
  if (!query) {
    return [];
  }

  const pageSize = Math.min(Math.max(limit, 1), 20);

  try {
    const url = new URL(OPENVERSE_ENDPOINT);
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", String(pageSize));
    url.searchParams.set("license_type", "all");
    url.searchParams.set("exclude_sensitive_results", "true");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PS-chat/1.0 (+https://ps-chat.local)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn("[image-search] request failed", response.status);
      return [];
    }

    const data = (await response.json()) as OpenverseResponse;
    if (!data.results?.length) {
      return [];
    }

    return data.results
      .filter((result) => Boolean(result.url))
      .slice(0, pageSize)
      .map((result) => ({
        id: result.id ?? randomUUID(),
        title: result.title ?? "Untitled image",
        imageUrl: result.url ?? "",
        thumbnailUrl: result.thumbnail ?? result.url ?? "",
        source:
          result.source ??
          result.provider ??
          result.foreign_landing_url ??
          "unknown",
        attribution: result.attribution,
        license: result.license,
        licenseUrl: result.license_url,
        creator: result.creator,
        detailUrl: result.detail_url ?? result.foreign_landing_url,
      }));
  } catch (error) {
    console.error("[image-search] unexpected error", error);
    return [];
  }
}
