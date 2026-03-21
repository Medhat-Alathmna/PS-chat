import { NextRequest } from "next/server";
import { generateObject } from "ai";
import { getCityExploreModelInstance } from "@/lib/ai/config";
import {
  buildSystemPrompt,
  getCityForRound,
  buildPrecomputedHint,
  buildHintImageQuery,
  normalizeArabic,
  GameResponseSchema,
} from "@/lib/ai/games/city-explorer";
import { CITIES } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { KidsChatContext, KidsProfile } from "@/lib/types/games";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { isImagesEnabled } from "@/lib/config/features";
import { enforceQuota, recordUsage } from "@/lib/api/token-quota";
import { logError } from "@/lib/utils/error-handler";
import { buildCacheOptions } from "@/lib/ai/cache";

type SimpleMessage = { role: "user" | "assistant"; content: string };

type GameChatRequest = {
  messages: SimpleMessage[];
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
  currentCityId?: string;
  currentRound?: number;
};

/**
 * Cap messages to prevent token bloat from many wrong guesses within a round.
 * Keeps the first 2 + last 4 messages.
 */
function trimMessages(messages: SimpleMessage[], maxMessages = 8): SimpleMessage[] {
  if (messages.length <= maxMessages) return messages;
  return [...messages.slice(0, 2), ...messages.slice(-4)];
}

export async function POST(req: NextRequest) {
  try {
    const quotaResult = await enforceQuota("games");
    if ("response" in quotaResult) return quotaResult.response;
    const { quota } = quotaResult;

    const body = (await req.json()) as GameChatRequest;
    const { messages = [], chatContext, kidsProfile, discoveredCityIds, currentCityId, currentRound } = body;

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const roundNumber = currentRound ?? 0;

    // Exclude list = all cities discovered in previous sessions + current session
    const excludeIds: string[] = [...(discoveredCityIds || [])];

    // Determine current city:
    // - If client sends currentCityId (round already started), use it directly
    // - Otherwise pick randomly from the remaining pool (first request)
    let currentCity = currentCityId
      ? CITIES.find(c => c.id === currentCityId)
      : undefined;

    let isReviewMode = false;
    if (!currentCity) {
      const result = getCityForRound(excludeIds);
      currentCity = result.city;
      isReviewMode = result.isReviewMode;
    }

    // Next city: random from remaining pool (excluding current)
    const nextExcludeIds = [...excludeIds, currentCity.id];
    const { city: nextCity } = getCityForRound(nextExcludeIds);

    // Pre-fetch hint images for BOTH cities in parallel (with 3s timeout)
    const IMAGE_TIMEOUT_MS = 3000;
    const fetchWithTimeout = (query: string): Promise<ImageResult[]> => {
      if (!isImagesEnabled()) return Promise.resolve([]);
      return Promise.race([
        searchImagesMultiSource(query, 2, true).catch(() => []),
        new Promise<ImageResult[]>(resolve => setTimeout(() => resolve([]), IMAGE_TIMEOUT_MS)),
      ]);
    };

    const [currentImages, nextImages] = await Promise.all([
      fetchWithTimeout(buildHintImageQuery(currentCity)),
      fetchWithTimeout(buildHintImageQuery(nextCity)),
    ]);

    const currentHint = buildPrecomputedHint(currentCity, currentImages);
    const nextHint = buildPrecomputedHint(nextCity, nextImages);

    // Server-side answer pre-validation
    const lastUserMsg = messages.findLast((m) => m.role === "user");
    const lastText = lastUserMsg?.content ?? "";
    const isCorrect = !!lastText && normalizeArabic(lastText) === normalizeArabic(currentCity.nameAr);


    const systemPrompt = buildSystemPrompt(
      currentCity,
      nextCity,
      isReviewMode,
      kidsProfile?.name,
      chatContext,
      isCorrect,
    );


    const trimmedMessages = trimMessages(messages);

    const generateResult = await generateObject({
      model: getCityExploreModelInstance(),
      schema: GameResponseSchema,
      system: systemPrompt,
      messages: trimmedMessages.map(m => ({ role: m.role, content: m.content })),
      ...buildCacheOptions("game"),
    });
    const turn = generateResult.object;

    const updatedQuota = await recordUsage(quota, generateResult.usage?.totalTokens ?? 0, "games");

    // Pick hint: if correct answer was given, inject next city's hint
    const hint = isCorrect ? nextHint : currentHint;
    const targetCityId = isCorrect ? nextCity.id : currentCity.id;

    // Auto-inject correct city if model omitted it from options (turn only)
    if (turn.type === "turn") {
      if (!turn.options) turn.options = [];
      const correctCity = isCorrect ? nextCity.nameAr : currentCity.nameAr;
      if (!turn.options.includes(correctCity)) {
        const insertIdx = Math.floor(Math.random() * (turn.options.length + 1));
        turn.options.splice(insertIdx, 0, correctCity);
      }
    }

    const cleanHintImages = hint.images
      .filter(img => (img.thumbnailUrl || img.imageUrl)?.startsWith("http"))
      .map(img => img.thumbnailUrl || img.imageUrl)
      .filter(Boolean) as string[];

    return Response.json({
      turn,
      currentCityId: currentCity.id,
      targetCityId,
      targetCityNameAr: isCorrect ? nextCity.nameAr : currentCity.nameAr,
      hint: hint.hint,
      hintImages: cleanHintImages,
      isCorrect,
      quota: updatedQuota,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logError("game-chat-route", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ. يرجى المحاولة مرة أخرى.", detail: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
