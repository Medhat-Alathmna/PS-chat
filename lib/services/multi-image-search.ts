import { ImageResult } from "@/lib/types";
import { searchWikimedia } from "./images/wikimedia";
import { searchUnsplash } from "./images/unsplash";
import { searchPexels } from "./images/pexels";
import { searchOpenverse } from "./images/openverse";
import { logError } from "../utils/error-handler";

/**
 * Search for images from multiple sources with intelligent fallback
 * Priority order: Wikimedia (best for Palestinian historical sites) → Unsplash → Pexels → Openverse
 *
 * @param query - Search query
 * @param limit - Maximum number of images to return (default: 4)
 * @returns Promise<ImageResult[]> - Array of images from available sources
 */
export async function searchImagesMultiSource(
  query: string,
  limit: number = 4
): Promise<ImageResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  // Define search sources in priority order
  const sources = [
    {
      name: "wikimedia",
      fn: () => searchWikimedia(trimmedQuery, limit),
      priority: 1,
    },
    {
      name: "unsplash",
      fn: () => searchUnsplash(trimmedQuery, limit),
      priority: 2,
    },
    {
      name: "pexels",
      fn: () => searchPexels(trimmedQuery, limit),
      priority: 3,
    },
    {
      name: "openverse",
      fn: () => searchOpenverse(trimmedQuery, limit),
      priority: 4,
    },
  ];

  const allImages: ImageResult[] = [];

  // Try each source sequentially until we have enough images
  for (const source of sources) {
    if (allImages.length >= limit) {
      break; // We have enough images
    }

    try {
      const result = await source.fn();

      if (result.success && result.data && result.data.length > 0) {
        allImages.push(...result.data);
        console.log(
          `[multi-image-search] Found ${result.data.length} images from ${source.name}`
        );
      } else if (!result.success) {
        // Log the error but continue to next source
        console.warn(
          `[multi-image-search] ${source.name} failed: ${result.error || "Unknown error"}`
        );
      }
    } catch (error) {
      // If one source fails, continue to the next
      logError(`multi-image-search:${source.name}`, error);
      continue;
    }
  }

  // Return up to the requested limit
  return allImages.slice(0, limit);
}

/**
 * Search for images from a specific source only
 * Useful for testing or when you want to target a specific provider
 */
export async function searchImagesFromSource(
  query: string,
  source: "wikimedia" | "unsplash" | "pexels" | "openverse",
  limit: number = 4
): Promise<ImageResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  let result;

  switch (source) {
    case "wikimedia":
      result = await searchWikimedia(trimmedQuery, limit);
      break;
    case "unsplash":
      result = await searchUnsplash(trimmedQuery, limit);
      break;
    case "pexels":
      result = await searchPexels(trimmedQuery, limit);
      break;
    case "openverse":
      result = await searchOpenverse(trimmedQuery, limit);
      break;
    default:
      return [];
  }

  return result.success && result.data ? result.data : [];
}
