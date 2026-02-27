import { tool } from "ai";
import { z } from "zod";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { geocodeLocation } from "@/lib/services/maps/geocoding";
import { searchYouTubeVideos } from "@/lib/services/video/youtube";
import { fetchPalestinianNews } from "@/lib/services/news/rss-parser";
import { searchTimelineByKeyword, getTimelineEvents } from "@/lib/data/palestinian-history";
import { ImageResult, Coordinates, VideoResult, NewsItem, TimelineEvent } from "@/lib/types";

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
    "ابحث عن صور متعلقة بفلسطين. استخدم هذه الأداة عندما يسأل المستخدم عن مكان أو موضوع ويحتاج صور توضيحية. " +
    "Search for images related to Palestine. Use this tool when the user asks about a place or topic and needs illustrative images. " +
    "For games, use SPECIFIC place/landmark names in the query (e.g. 'المسجد الأقصى القدس' not 'مدينة فلسطينية'). Real photos of landmarks and food are naturally kid-friendly!",
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
    "Find a Palestinian location and show it on the map. Use ONLY after the user asks to see a place on the map. " +
    "IMPORTANT: After this tool succeeds, NEVER mention lat/lng numbers or the formattedAddress in your text response — just confirm the place name and that it's shown on the map.",
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

/**
 * Video Search Tool
 * Finds YouTube videos about Palestinian topics
 */
export const videoSearchTool = tool({
  description:
    "ابحث عن فيديوهات عن فلسطين من YouTube. استخدم هذه الأداة عندما يريد المستخدم مشاهدة فيديو أو وثائقي. " +
    "Search for YouTube videos about Palestine. Use this tool when the user wants to watch a video or documentary.",
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

/**
 * News Search Tool
 * Fetches latest Palestinian news from RSS feeds
 */
export const newsSearchTool = tool({
  description:
    "احصل على أحدث أخبار فلسطين من مصادر إخبارية فلسطينية. استخدم هذه الأداة للأخبار المحلية والثقافية. " +
    "Get latest Palestinian news from Palestinian news sources. Use this tool for local and cultural news.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Optional search query to filter news (e.g., 'ثقافة', 'رام الله')"),
    limit: z
      .number()
      .min(1)
      .max(5)
      .default(3)
      .describe("Number of news items to return (1-5)"),
  }),
  execute: async ({ query, limit = 3 }): Promise<NewsSearchResult> => {
    try {
      const result = await fetchPalestinianNews(query, limit);

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          query: query || "",
          news: [],
          message: "لم يتم العثور على أخبار",
        };
      }

      return {
        success: true,
        query: query || "",
        news: result.data,
        message: `تم العثور على ${result.data.length} خبر`,
      };
    } catch (error) {
      console.error("[news_search] Error:", error);
      return {
        success: false,
        query: query || "",
        news: [],
        message: "حدث خطأ أثناء جلب الأخبار",
      };
    }
  },
});

/**
 * Timeline Search Tool
 * Retrieves Palestinian historical events
 */
export const timelineSearchTool = tool({
  description:
    "احصل على جدول زمني للأحداث التاريخية الفلسطينية. استخدم هذه الأداة عندما يسأل المستخدم عن التاريخ أو الأحداث. " +
    "Get a timeline of Palestinian historical events. Use this tool when the user asks about history or events.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Search keyword (e.g., 'نكبة', '1948', 'القدس')"),
    startYear: z
      .number()
      .optional()
      .describe("Start year for filtering (e.g., 1900)"),
    endYear: z
      .number()
      .optional()
      .describe("End year for filtering (e.g., 2000)"),
    category: z
      .enum(["political", "cultural", "military", "social", "other"])
      .optional()
      .describe("Category filter"),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Number of events to return (1-10)"),
  }),
  execute: async ({
    query,
    startYear,
    endYear,
    category,
    limit = 5,
  }): Promise<TimelineSearchResult> => {
    try {
      let events: TimelineEvent[];

      if (query) {
        events = searchTimelineByKeyword(query);
      } else {
        events = getTimelineEvents({
          startYear,
          endYear,
          category,
          limit,
        });
      }

      if (events.length === 0) {
        return {
          success: false,
          query: query || "",
          events: [],
          message: "لم يتم العثور على أحداث تاريخية",
        };
      }

      // Apply limit
      events = events.slice(0, limit);

      return {
        success: true,
        query: query || "",
        events,
        message: `تم العثور على ${events.length} حدث تاريخي`,
      };
    } catch (error) {
      console.error("[timeline_search] Error:", error);
      return {
        success: false,
        query: query || "",
        events: [],
        message: "حدث خطأ أثناء البحث في التاريخ",
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

export type TimelineSearchResult = {
  success: boolean;
  query: string;
  events: TimelineEvent[];
  message: string;
};

// ============================================
// EXPORT ALL TOOLS
// ============================================

export const allTools = {
  image_search: imageSearchTool,
  location_search: locationSearchTool,
  web_search: webSearchTool,
  video_search: videoSearchTool,
  news_search: newsSearchTool,
  timeline_search: timelineSearchTool,
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
