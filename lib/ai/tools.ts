import { tool } from "ai";
import { z } from "zod";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { geocodeLocation } from "@/lib/services/maps/geocoding";
import { searchYouTubeVideos } from "@/lib/services/video/youtube";
import { ImageResult, Coordinates, VideoResult, NewsItem } from "@/lib/types";

// ============================================
// CHIP SCHEMAS (for experimental_output / Output.object)
// ============================================

export const chipSchema = z.object({
  text: z.string().min(2).max(30),
  type: z.enum(["photo", "map", "curiosity", "activity"]),
  // nullable (not optional) — OpenAI structured output requires all keys in `required`
  actionQuery: z.string().nullable(),
});

export const chipsOutputSchema = z.object({
  chips: z.array(chipSchema).min(1).max(5),
});

/**
 * Image Search Tool
 * Searches for images related to Palestinian places, culture, and history
 * NEW: Automatically uses kid-friendly mode for games (adds "cartoon child-friendly" to queries)
 */
export const imageSearchTool = tool({
  description:
    "Search for Palestinian images. Use SPECIFIC landmark/place names. Only call AFTER user confirms.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query for images — use SPECIFIC landmark/place names with city name for best results (e.g., 'Al-Aqsa Mosque Jerusalem', 'Nablus knafeh', 'Jaffa port oranges')"
      ),
    limit: z
      .number()
      .min(1)
      .max(8)
      .default(4)
      .describe("Number of images to return (1-8)"),
    isKidsMode: z
      .boolean()
      .optional()
      .default(true)
      .describe("Use kid-friendly images (cartoon style). Default: true for games."),
  }),
  execute: async ({ query, limit = 4, isKidsMode = true }): Promise<ImageSearchResult> => {
    try {
      const images = await searchImagesMultiSource(query, limit, isKidsMode);

      if (images.length === 0) {
        return {
          success: false,
          query,
          images: [],
          message: `لم يتم العثور على صور لـ "${query}"`,
        };
      }

      return {
        success: true,
        query,
        images,
        message: `تم العثور على ${images.length} صورة لـ "${query}"`,
      };
    } catch (error) {
      console.error("[image_search] Error:", error);
      return {
        success: false,
        query,
        images: [],
        message: "حدث خطأ أثناء البحث عن الصور",
      };
    }
  },
});

/**
 * Location Search Tool
 * Finds coordinates and information about Palestinian locations
 */
export const locationSearchTool = tool({
  description:
    "Show Palestinian location on map. Only call AFTER user confirms. Never mention lat/lng or raw address.",
  inputSchema: z.object({
    location: z
      .string()
      .describe(
        "Location name to search for (e.g., 'Jerusalem', 'Bethlehem', 'Nablus')"
      ),
  }),
  execute: async ({ location }): Promise<LocationSearchResult> => {
    try {
      // Add "Palestine" context to improve search results
      const searchQuery = location.toLowerCase().includes("فلسطين") ||
        location.toLowerCase().includes("palestine")
        ? location
        : `${location}, Palestine`;

      const result = await geocodeLocation(searchQuery);

      if (!result.success || !result.data) {
        return {
          success: false,
          location,
          coordinates: null,
          message: `لم يتم العثور على موقع "${location}"`,
        };
      }

      return {
        success: true,
        location,
        coordinates: result.data.coordinates,
        mapUpdated: true,
        message: `Map updated — ${location} is now shown on the map. Do NOT mention coordinates or the raw address in your response.`,
      };
    } catch (error) {
      console.error("[location_search] Error:", error);
      return {
        success: false,
        location,
        coordinates: null,
        message: "حدث خطأ أثناء البحث عن الموقع",
      };
    }
  },
});


/**
 * Video Search Tool
 * Finds YouTube videos about Palestinian topics
 */
export const videoSearchTool = tool({
  description:
    "Search YouTube for Palestinian videos. Use when user asks to watch.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query for videos (e.g., 'Palestinian cuisine', 'Jerusalem history', 'Nakba documentary')"
      ),
  }),
  execute: async ({ query }): Promise<VideoSearchResult> => {
    try {
      const result = await searchYouTubeVideos(query);

      if (!result.success || !result.data) {
        return {
          success: false,
          query,
          video: null,
          message: `لم يتم العثور على فيديو لـ "${query}"`,
        };
      }

      return {
        success: true,
        query,
        video: result.data,
        message: `تم العثور على فيديو: "${result.data.title}"`,
      };
    } catch (error) {
      console.error("[video_search] Error:", error);
      return {
        success: false,
        query,
        video: null,
        message: "حدث خطأ أثناء البحث عن الفيديو",
      };
    }
  },
});


// ============================================
// TOOL RESULT TYPES
// ============================================

export type ImageSearchResult = {
  success: boolean;
  query: string;
  images: ImageResult[];
  message: string;
};

export type LocationSearchResult = {
  success: boolean;
  location: string;
  coordinates: Coordinates | null;
  mapUpdated?: boolean;
  message: string;
};

export type VideoSearchResult = {
  success: boolean;
  query: string;
  video: VideoResult | null;
  message: string;
};

export type NewsSearchResult = {
  success: boolean;
  query: string;
  news: NewsItem[];
  message: string;
};

// ============================================
// EXPORT ALL TOOLS
// ============================================

export const allTools = {
  image_search: imageSearchTool,
  location_search: locationSearchTool,
  video_search: videoSearchTool,
};

/**
 * Kids chat tools - limited set with conversational usage
 * Only image_search and location_search for child-friendly experience
 * Chips are now generated via experimental_output (Output.object) — not a tool
 */
export const kidsTools = {
  image_search: imageSearchTool,
  location_search: locationSearchTool,
};
