import { tool } from "ai";
import { z } from "zod";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { geocodeLocation } from "@/lib/services/maps/geocoding";
import { ImageResult, Coordinates } from "@/lib/types";

/**
 * Image Search Tool
 * Searches for images related to Palestinian places, culture, and history
 */
export const imageSearchTool = tool({
  description:
    "ابحث عن صور متعلقة بفلسطين. استخدم هذه الأداة عندما يسأل المستخدم عن مكان أو موضوع ويحتاج صور توضيحية. " +
    "Search for images related to Palestine. Use this tool when the user asks about a place or topic and needs illustrative images.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query for images (e.g., 'Al-Aqsa Mosque', 'Gaza beach', 'Palestinian embroidery')"
      ),
    limit: z
      .number()
      .min(1)
      .max(8)
      .default(4)
      .describe("Number of images to return (1-8)"),
  }),
  execute: async ({ query, limit = 4 }): Promise<ImageSearchResult> => {
    try {
      const images = await searchImagesMultiSource(query, limit);

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
    "ابحث عن موقع جغرافي في فلسطين واحصل على إحداثياته. استخدم هذه الأداة عندما يسأل المستخدم عن مكان معين ويحتاج خريطة. " +
    "Search for a geographic location in Palestine and get its coordinates. Use this tool when the user asks about a specific place and needs a map.",
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
          formattedAddress: null,
          message: `لم يتم العثور على موقع "${location}"`,
        };
      }

      return {
        success: true,
        location,
        coordinates: result.data.coordinates,
        formattedAddress: result.data.formattedAddress,
        message: `تم العثور على "${location}" في ${result.data.formattedAddress}`,
      };
    } catch (error) {
      console.error("[location_search] Error:", error);
      return {
        success: false,
        location,
        coordinates: null,
        formattedAddress: null,
        message: "حدث خطأ أثناء البحث عن الموقع",
      };
    }
  },
});

/**
 * Web Search Tool
 * Searches the web for information about Palestine
 */
export const webSearchTool = tool({
  description:
    "ابحث في الإنترنت عن معلومات حديثة عن فلسطين. استخدم هذه الأداة للحصول على أخبار أو معلومات محدثة. " +
    "Search the web for recent information about Palestine. Use this tool to get news or updated information.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query (e.g., 'Palestinian culture', 'Gaza history', 'West Bank cities')"
      ),
  }),
  execute: async ({ query }): Promise<WebSearchResult> => {
    try {
      // Add Palestine context to search
      const searchQuery = query.toLowerCase().includes("فلسطين") ||
        query.toLowerCase().includes("palestine")
        ? query
        : `${query} Palestine`;

      // Use DuckDuckGo Instant Answer API (free, no API key needed)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      const results: WebSearchResultItem[] = [];

      // Extract abstract if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          snippet: data.Abstract,
          url: data.AbstractURL || "",
          source: data.AbstractSource || "DuckDuckGo",
        });
      }

      // Extract related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, 5)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
              snippet: topic.Text,
              url: topic.FirstURL,
              source: "DuckDuckGo",
            });
          }
        }
      }

      if (results.length === 0) {
        return {
          success: false,
          query,
          results: [],
          message: `لم يتم العثور على نتائج لـ "${query}"`,
        };
      }

      return {
        success: true,
        query,
        results,
        message: `تم العثور على ${results.length} نتيجة لـ "${query}"`,
      };
    } catch (error) {
      console.error("[web_search] Error:", error);
      return {
        success: false,
        query,
        results: [],
        message: "حدث خطأ أثناء البحث في الإنترنت",
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
  formattedAddress: string | null;
  message: string;
};

export type WebSearchResultItem = {
  title: string;
  snippet: string;
  url: string;
  source: string;
};

export type WebSearchResult = {
  success: boolean;
  query: string;
  results: WebSearchResultItem[];
  message: string;
};

// ============================================
// EXPORT ALL TOOLS
// ============================================

export const allTools = {
  image_search: imageSearchTool,
  location_search: locationSearchTool,
  web_search: webSearchTool,
};
