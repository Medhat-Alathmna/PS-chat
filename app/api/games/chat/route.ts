import { NextRequest } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { buildSystemPrompt, buildTools, getCityForRound, trimCompletedRounds, buildPrecomputedHint, buildHintImageQuery } from "@/lib/ai/games/city-explorer";
import { CITIES, detectCityInText } from "@/lib/data/cities";
import { ImageResult } from "@/lib/types";
import { GameDifficulty, KidsChatContext, KidsProfile } from "@/lib/types/games";
import { searchImagesMultiSource } from "@/lib/services/multi-image-search";
import { logError } from "@/lib/utils/error-handler";
import { buildCacheOptions, formatCacheUsage } from "@/lib/ai/cache";

type GameChatRequest = {
  messages: UIMessage[];
  difficulty?: GameDifficulty;
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
  sessionSeed?: number;
  currentRound?: number;
};

/**
 * Detect if the user's last message signals "move to next question".
 * When true, the system prompt is pre-built for round N+1 so the AI can
 * present the next city's hint immediately after calling advance_round.
 */
function isNextRoundSignal(messages: UIMessage[]): boolean {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== "user") return false;
  const text = lastMsg.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join(" ");
  return (
    text.includes("السؤال الجاي") ||
    text.includes("السؤال التالي") ||
    text.includes("مدينة جديدة") ||
    text.includes("next question") ||
    text.includes("next city")
  );
}

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
 * Scan assistant messages for city names already mentioned (via check_answer explanations).
 * Returns an array of city IDs so getData() can exclude them.
 */
function extractUsedCityIds(messages: UIMessage[]): string[] {
  const ids = new Set<string>();
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      // Check text parts for Arabic city names
      if (part.type === "text" && part.text) {
        const id = detectCityInText(part.text);
        if (id) ids.add(id);
      }
      // Check tool invocation outputs (check_answer explanations)
      if (
        part.type === "tool-invocation" &&
        "output" in part &&
        part.output &&
        typeof part.output === "object" &&
        "explanation" in part.output &&
        typeof (part.output as Record<string, unknown>).explanation === "string"
      ) {
        const id = detectCityInText((part.output as Record<string, unknown>).explanation as string);
        if (id) ids.add(id);
      }
    }
  }
  return Array.from(ids);
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
    const { messages = [], difficulty, chatContext, kidsProfile, discoveredCityIds, sessionSeed, currentRound } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API key." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = createOpenAI({ apiKey });

    // Use client-supplied round (survives client-side message trimming),
    // fall back to counting advance_round calls in the message history.
    const roundNumber = currentRound ?? countAdvanceRounds(messages);
    const sessionSeedVal = sessionSeed || 0;
    const playerAge = kidsProfile?.age || 8;
    const gameDifficulty = difficulty || "medium";

    // If the user is asking for the next question, pre-load round N+1 into the
    // system prompt so the AI can present the new city immediately after
    // calling advance_round (without needing an extra round-trip).
    const advanceSignal = isNextRoundSignal(messages);
    const promptRound = advanceSignal ? roundNumber + 1 : roundNumber;

    // Compute exclude list for the prompt round (excludes all cities before it).
    // Seed with cross-session discovered cities so they are never repeated.
    // Pass sessionSeed + proper round numbers for deterministic selection.
    const previousRoundExcludeIds: string[] = [...(discoveredCityIds || [])];
    for (let r = 0; r < promptRound; r++) {
      const { city } = getCityForRound(previousRoundExcludeIds, r + 1, gameDifficulty, sessionSeedVal, playerAge);
      previousRoundExcludeIds.push(city.id);
    }

    // Get the city for the prompt round (for tool validation + system prompt)
    // Uses same params as buildSystemPrompt to guarantee the same city is selected.
    const { city: currentCity } = getCityForRound(
      previousRoundExcludeIds, promptRound + 1, gameDifficulty, sessionSeedVal, playerAge
    );
    // Pre-compute the next city so present_options accepts its answer in the combined
    // correct-answer response (check_answer + advance_round + next city — one round-trip).
    const nextExcludeIds = [...previousRoundExcludeIds, currentCity.id];
    const { city: nextCity } = getCityForRound(
      nextExcludeIds, promptRound + 2, gameDifficulty, sessionSeedVal, playerAge
    );

    // Pre-fetch hint images for BOTH cities in parallel (with 3s timeout)
    const IMAGE_TIMEOUT_MS = 3000;
    const fetchWithTimeout = (query: string): Promise<ImageResult[]> =>
      Promise.race([
        searchImagesMultiSource(query, 2, true).catch(() => []),
        new Promise<ImageResult[]>(resolve => setTimeout(() => resolve([]), IMAGE_TIMEOUT_MS)),
      ]);

    const [currentImages, nextImages] = await Promise.all([
      fetchWithTimeout(buildHintImageQuery(currentCity)),
      fetchWithTimeout(buildHintImageQuery(nextCity)),
    ]);

    // Build pre-computed hints from city data + pre-fetched images
    const currentHint = buildPrecomputedHint(currentCity, gameDifficulty, currentImages);
    const nextHint = buildPrecomputedHint(nextCity, gameDifficulty, nextImages);

    const tools = buildTools(currentCity.nameAr, currentCity.id, nextCity.nameAr, currentHint, nextHint);

    const systemPrompt = buildSystemPrompt(
      gameDifficulty,
      playerAge,
      kidsProfile?.name,
      chatContext,
      previousRoundExcludeIds,
      promptRound + 1,
      sessionSeedVal
    );

    // For display/trimming: include all discovered cities (current + previous)
    const sessionCityIds = extractUsedCityIds(messages);
    const allUsedCityIds = Array.from(
      new Set([...(discoveredCityIds || []), ...sessionCityIds])
    );

    console.log("[city-explorer] Round city:", currentCity.nameAr, "→ next:", nextCity.nameAr);

    // Trim old-round messages (saves 3k-10k+ tokens per request)
    let aiMessages = messages;
    if (trimCompletedRounds && roundNumber > 0) {
      const discoveredNames = allUsedCityIds
        .map((id) => CITIES.find((c) => c.id === id)?.nameAr)
        .filter(Boolean) as string[];
      aiMessages = trimCompletedRoundMessages(messages, promptRound, discoveredNames);
      console.log("[game-chat] Trimmed cross-round messages", {
        original: messages.length,
        trimmed: aiMessages.length,
        round: promptRound + 1,
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
        const cacheKey = `game-${sessionSeedVal}-d${gameDifficulty}-a${playerAge}`;
        const result = streamText({
          model: openai(getModel()),
          system: systemPrompt,
          messages: convertedMessages,
          tools,
          stopWhen: stepCountIs(5),
          ...buildCacheOptions(cacheKey),
          onStepFinish: ({ toolCalls, toolResults }) => {
            if (toolCalls?.length) {
              for (const call of toolCalls) {
                const result = toolResults?.find((r) => r.toolCallId === call.toolCallId);
                console.log("[game-chat] Tool call", {
                  tool: call.toolName,
                  args: call.args,
                  result: result?.result,
                });
              }
            }
          },
          onFinish: async ({ text, toolCalls, toolResults, usage }) => {
            const cache = formatCacheUsage(usage as Record<string, unknown>);
            console.log("[game-chat] Stream finished", {
              textLength: text.length,
              toolCallsCount: toolCalls?.length || 0,
              toolResultsCount: toolResults?.length || 0,
              ...(cache && { cache }),
            });
          },
        });

        writer.merge(result.toUIMessageStream());
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
