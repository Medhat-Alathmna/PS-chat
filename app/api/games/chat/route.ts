import { NextRequest } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { getCityExploreModelInstance } from "@/lib/ai/config";
import { buildSystemPrompt, buildTools, getCityForRound, trimCompletedRounds, buildPrecomputedHint, buildHintImageQuery, normalizeArabic } from "@/lib/ai/games/city-explorer";
import { CITIES } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { KidsChatContext, KidsProfile } from "@/lib/types/games";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { isImagesEnabled } from "@/lib/config/features";
import { logError } from "@/lib/utils/error-handler";
import { buildCacheOptions } from "@/lib/ai/cache";
import { makeStreamingCallbacks } from "@/lib/ai/logging";

type GameChatRequest = {
  messages: UIMessage[];
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
  currentCityId?: string;
  currentRound?: number;
};

/**
 * Count advance_round tool calls to determine the current round number.
 * Used as a deterministic seed for city selection (same round = same city).
 */
function countAdvanceRounds(messages: UIMessage[]): number {
  let count = 0;
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "tool-invocation") {
        const p = part as Record<string, unknown>;
        // Detect advance_round by toolName or output shape
        if (
          p.toolName === "advance_round" ||
          (p.output && typeof p.output === "object" && "roundCompleted" in (p.output as object))
        ) {
          count++;
        }
      }
    }
  }
  return count;
}

/**
 * Extract GAME_TURN JSON from model text output.
 * Model appends: \nGAME_TURN:{"options":["مدينة أ","مدينة ب"]}
 */
function extractGameTurnFromText(text: string): { options: string[] } | null {
  const idx = text.lastIndexOf("\nGAME_TURN:");
  if (idx === -1) return null;
  try {
    const jsonStr = text.slice(idx + "\nGAME_TURN:".length).trim();
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed?.options) && parsed.options.length > 0) {
      return { options: parsed.options };
    }
  } catch {
    // parse failed
  }
  return null;
}

/**
 * Trim completed-round messages, keeping only a brief Arabic summary + current round.
 * The AI already gets fresh city data via the system prompt, so old round messages add no value.
 */
function trimCompletedRoundMessages(
  messages: UIMessage[],
  currentRound: number,
  discoveredCityNames: string[]
): UIMessage[] {
  // Find the last advance_round tool invocation — everything before it is a completed round
  let lastAdvanceIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (
        part.type === "tool-invocation" &&
        (part as Record<string, unknown>).toolName === "advance_round"
      ) {
        lastAdvanceIdx = i;
        break;
      }
    }
    if (lastAdvanceIdx !== -1) break;
  }

  if (lastAdvanceIdx === -1) return messages; // round 1 — nothing to trim

  const citiesList = discoveredCityNames.length
    ? discoveredCityNames.join("، ")
    : "—";

  const summaryText = `[ملخص الجولات السابقة]
الجولة الحالية: ${currentRound + 1}
المدن المكتشفة: ${citiesList}
---
أكمل اللعبة من هنا!`;

  const summaryMessage: UIMessage = {
    id: "round-summary",
    role: "user",
    parts: [{ type: "text", text: summaryText }],
  };

  return [summaryMessage, ...messages.slice(lastAdvanceIdx + 1)];
}

/**
 * Cap within-round messages to prevent token bloat from many wrong guesses.
 * Keeps the first 2 messages (riddle/options context) + last 4 (recent attempts).
 */
function trimWithinRoundMessages(
  messages: UIMessage[],
  maxMessages = 8
): UIMessage[] {
  if (messages.length <= maxMessages) return messages;
  return [...messages.slice(0, 2), ...messages.slice(-4)];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GameChatRequest;
    const { messages = [], chatContext, kidsProfile, discoveredCityIds, currentCityId, currentRound } = body;

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const roundNumber = currentRound ?? countAdvanceRounds(messages);
    const playerAge = kidsProfile?.age || 8;

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
    // Skip entirely if images are disabled via ENABLE_IMAGES=false
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

    // Build pre-computed hints from city data + pre-fetched images
    const currentHint = buildPrecomputedHint(currentCity, currentImages);
    const nextHint = buildPrecomputedHint(nextCity, nextImages);

    const tools = buildTools();

    // Server-side answer pre-validation — normalize Arabic to catch Unicode variants
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastText = lastUserMsg?.parts.find((p) => p.type === "text")
      ? (lastUserMsg.parts.find((p) => p.type === "text") as { type: "text"; text: string }).text
      : "";
    const confirmedCorrect = !!lastText && normalizeArabic(lastText) === normalizeArabic(currentCity.nameAr);
    if (confirmedCorrect) {
      console.log("[city-explorer] Server confirmed correct answer:", lastText);
    }

    const systemPrompt = buildSystemPrompt(
      playerAge,
      currentCity,
      nextCity,
      isReviewMode,
      kidsProfile?.name,
      chatContext,
      confirmedCorrect,
    );

    console.log("[city-explorer] Round city:", currentCity.nameAr, "→ next:", nextCity.nameAr);

    // Trim old-round messages (saves 3k-10k+ tokens per request)
    let aiMessages = messages;
    if (trimCompletedRounds && roundNumber > 0) {
      const discoveredNames = excludeIds
        .map((id) => CITIES.find((c) => c.id === id)?.nameAr)
        .filter(Boolean) as string[];
      aiMessages = trimCompletedRoundMessages(messages, roundNumber, discoveredNames);
      console.log("[game-chat] Trimmed cross-round messages", {
        original: messages.length,
        trimmed: aiMessages.length,
        round: roundNumber + 1,
      });
    }

    // Cap within-round messages (safety net for many wrong guesses)
    const preTrimCount = aiMessages.length;
    aiMessages = trimWithinRoundMessages(aiMessages);
    if (aiMessages.length < preTrimCount) {
      console.log("[game-chat] Trimmed within-round messages", {
        before: preTrimCount,
        after: aiMessages.length,
      });
    }

    const convertedMessages = await convertToModelMessages(aiMessages);

    const uiStream = createUIMessageStream({
      execute: async ({ writer }) => {
        const cacheKey = `game-a${playerAge}`;
        const result = streamText({
          model: getCityExploreModelInstance(),
          system: systemPrompt,
          messages: convertedMessages,
          tools,
          stopWhen: stepCountIs(5),
          ...buildCacheOptions(cacheKey),
          ...makeStreamingCallbacks("game-chat", { logToolResults: true }),
        });

        writer.merge(result.toUIMessageStream());

        const steps = await result.steps;
        const fullText = steps.map((s) => s.text).join("");

          // Log all tool calls from all steps
          try {
            for (const step of steps) {
              for (const tr of step.toolResults ?? []) {
                const tc = step.toolCalls?.find((c: { toolCallId: string }) => c.toolCallId === (tr as { toolCallId: string }).toolCallId);
                console.log("[game-tool]", (tr as { toolName: string }).toolName, {
                  input: tc ? (tc as unknown as { input: unknown }).input : undefined,
                  output: (tr as unknown as { output: unknown }).output,
                });
              }
            }
          } catch (logErr) {
            console.error("[game-tool] logging error:", logErr);
          }

          // Inject data-game-turn
          try {
            const gameTurn = extractGameTurnFromText(fullText);
            if (gameTurn) {
              const hadAdvance = steps.some((step) =>
                step.toolResults?.some(
                  (tr: { toolName: string }) => tr.toolName === "advance_round"
                )
              );
              const hint = hadAdvance ? nextHint : currentHint;

              // Validate options — auto-inject correct city if missing
              const correctCity = hadAdvance ? nextCity.nameAr : currentCity.nameAr;
              if (!gameTurn.options.includes(correctCity)) {
                const insertIdx = Math.floor(Math.random() * (gameTurn.options.length + 1));
                gameTurn.options.splice(insertIdx, 0, correctCity);
                console.warn(`[city-explorer] Auto-injected correct answer: ${correctCity}`);
              }

              const targetCity = hadAdvance ? nextCity : currentCity;

              // Sanitize before writing to stream
              const cleanOptions = gameTurn.options
                .map((o) => o.trim())
                .filter((o) => o.length > 0);
              const cleanHint = hint.hint.trim();
              const cleanImages = hint.images.filter(
                (img) => (img.thumbnailUrl || img.imageUrl)?.startsWith("http")
              );
              const cleanTargetCityId = targetCity.id.trim();

              const gameData = {
                options: cleanOptions,
                hint: cleanHint,
                hintImages: cleanImages.map((img) => img.thumbnailUrl || img.imageUrl),
                targetCityId: cleanTargetCityId,
                hadAdvance,
              };
              console.log("[game-turn]", JSON.stringify(gameData, null, 2));
              writer.write({
                type: "data-game-turn",
                data: {
                  options: cleanOptions,
                  hint: cleanHint,
                  hintImages: cleanImages,
                  targetCityId: cleanTargetCityId,
                },
              });
            } else {
              console.log("[game-turn] null — no GAME_TURN found in response");
            }
          } catch (injectErr) {
            console.error("[game-turn] injection error:", injectErr);
          }
      },
    });

    return createUIMessageStreamResponse({ stream: uiStream });
  } catch (error) {
    logError("game-chat-route", error);
    return new Response(
      JSON.stringify({
        error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
