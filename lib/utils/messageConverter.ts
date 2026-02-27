/**
 * Shared utilities for converting AI SDK messages to app-specific formats.
 * Used by both chat page and game page.
 */

import {
  ChatMessage,
  ImageResult,
  LocationInfo,
  MapData,
  WebSearchResultItem,
  VideoResult,
  NewsItem,
  TimelineEvent,
  SuggestionChip,
} from "@/lib/types";
import { normalizeSuggestions } from "@/app/components/kids/games/QuickReplyChips";

/**
 * Extracts chips from the full response text.
 * The model appends a chips block at the end: "chips: [{...}]" or "CHIPS:{"chips":[...]}"
 * Handles lowercase/uppercase, multiline JSON, and both array and object wrapping.
 */
export function extractChipsFromText(text: string): { chips: unknown[] } | null {
  const match = text.match(/\nCHIPS:\s*([\s\S]+)$/i);
  if (!match) return null;
  try {
    let raw = match[1].trim();
    // Model may output [...] directly instead of {"chips":[...]}
    if (raw.startsWith("[")) raw = `{"chips":${raw}}`;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.chips) && parsed.chips.length > 0) return parsed;
  } catch {
    // parse failed
  }
  return null;
}

/**
 * Extracts text content and image file parts from message parts.
 */
export function extractTextAndImages(parts: unknown[]): {
  textContent: string;
  userImageParts: { url: string; mediaType: string }[];
  inlineChips: { chips: unknown[] } | null;
} {
  let rawText = "";
  const userImageParts: { url: string; mediaType: string }[] = [];

  for (const part of parts) {
    const p = part as { type: string; text?: string; mediaType?: string; url?: string };
    if (p.type === "text" && p.text) {
      rawText += p.text;
    } else if (p.type === "file" && p.mediaType?.startsWith("image/") && p.url) {
      userImageParts.push({ url: p.url, mediaType: p.mediaType });
    }
  }

  // Extract chips from raw text, then strip the chips block from display text
  const inlineChips = extractChipsFromText(rawText);
  const chipsPos = rawText.search(/\nCHIPS:/i);
  const textContent = chipsPos >= 0 ? rawText.slice(0, chipsPos).trim() : rawText;

  return { textContent, userImageParts, inlineChips };
}

/**
 * Gets typed tool output from message parts.
 * Returns null if tool not found or not completed.
 */
export function getToolOutput<T>(
  parts: unknown[],
  toolName: string
): T | null {
  for (const part of parts) {
    const p = part as {
      type: string;
      state?: string;
      output?: unknown;
    };
    
    if (p.type === `tool-${toolName}` && p.state === "output-available" && p.output) {
      return p.output as T;
    }
  }
  
  return null;
}

/**
 * Tool output types for the chat page
 */
interface ImageSearchOutput {
  success: boolean;
  images: ImageResult[];
}

interface LocationSearchOutput {
  success: boolean;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  mapUpdated?: boolean;
}

interface WebSearchOutput {
  success: boolean;
  results: WebSearchResultItem[];
}

interface VideoSearchOutput {
  success: boolean;
  video: VideoResult;
}

interface NewsSearchOutput {
  success: boolean;
  news: NewsItem[];
}

interface TimelineSearchOutput {
  success: boolean;
  events: TimelineEvent[];
}

/**
 * Builds a ChatMessage from an AI SDK message.
 * Handles tools: image_search, location_search, web_search, video_search,
 * news_search, timeline_search. Chips come from data-chips part (experimental_output).
 */
export function buildChatMessage(
  msg: { id: string; role: string; parts: unknown[] },
  index: number
): ChatMessage {
  const { textContent, userImageParts, inlineChips } = extractTextAndImages(msg.parts);

  let images: ImageResult[] | undefined;
  let location: LocationInfo | undefined;
  let mapData: MapData | undefined;
  let webSearchResults: WebSearchResultItem[] | undefined;
  let video: VideoResult | undefined;
  let news: NewsItem[] | undefined;
  let timeline: TimelineEvent[] | undefined;
  let suggestRepliesData: { suggestions: SuggestionChip[] } | undefined;

  // Process image_search
  const imageResult = getToolOutput<ImageSearchOutput>(msg.parts, "image_search");
  if (imageResult?.success && imageResult?.images) {
    images = imageResult.images;
  }

  // Process location_search
  const locationResult = getToolOutput<LocationSearchOutput>(msg.parts, "location_search");
  if (locationResult?.success && locationResult?.coordinates) {
    location = {
      name: locationResult.location,
      coordinates: locationResult.coordinates,
    };
    mapData = {
      coordinates: locationResult.coordinates,
      zoom: 14,
      label: locationResult.location,
    };
  }

  // Process web_search
  const webResult = getToolOutput<WebSearchOutput>(msg.parts, "web_search");
  if (webResult?.success && webResult?.results?.length > 0) {
    webSearchResults = webResult.results;
  }

  // Process video_search
  const videoResult = getToolOutput<VideoSearchOutput>(msg.parts, "video_search");
  if (videoResult?.success && videoResult?.video) {
    video = videoResult.video;
  }

  // Process news_search
  const newsResult = getToolOutput<NewsSearchOutput>(msg.parts, "news_search");
  if (newsResult?.success && newsResult?.news?.length > 0) {
    news = newsResult.news;
  }

  // Process timeline_search
  const timelineResult = getToolOutput<TimelineSearchOutput>(msg.parts, "timeline_search");
  if (timelineResult?.success && timelineResult?.events?.length > 0) {
    timeline = timelineResult.events;
  }

  // Process chips — prefer inline CHIPS: from text, fall back to data-chips part
  const chipsSource = inlineChips?.chips?.length
    ? inlineChips.chips
    : (msg.parts as Array<{ type?: string; data?: { chips?: unknown[] } }>)
        ?.find((p) => p?.type === "data-chips")?.data?.chips;
  if (chipsSource?.length) {
    suggestRepliesData = { suggestions: normalizeSuggestions(chipsSource) };
  }

  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: textContent,
    createdAt: index,
    images,
    userImages: userImageParts.length > 0 ? userImageParts : undefined,
    location,
    mapData,
    webSearchResults,
    video,
    news,
    timeline,
    suggestRepliesData,
  };
}

/**
 * Converts an array of AI SDK messages to ChatMessage format.
 */
export function convertMessages(aiMessages: Array<{ id: string; role: string; parts: unknown[] }>): ChatMessage[] {
  return aiMessages.map((msg, index) => buildChatMessage(msg, index));
}