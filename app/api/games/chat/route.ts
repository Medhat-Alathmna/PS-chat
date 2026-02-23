import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { buildSystemPrompt, buildTools, getCityForRound, trimCompletedRounds } from "@/lib/ai/games/city-explorer";
import { CITIES, detectCityInText } from "@/lib/data/cities";
import { GameDifficulty, KidsChatContext, KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";

type GameChatRequest = {
  messages: UIMessage[];
  difficulty?: GameDifficulty;
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
  sessionSeed?: number;
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GameChatRequest;
    const { messages = [], difficulty, chatContext, kidsProfile, discoveredCityIds, sessionSeed } = body;

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

    // Combine session seed (random per game session) + round number for city selection.
    // This ensures each session starts with a different city while staying
    // deterministic within a session (same round = same city on retries).
    const roundNumber = countAdvanceRounds(messages);
    const sessionSeedVal = sessionSeed || 0;

    // If the user is asking for the next question, pre-load round N+1 into the
    // system prompt so the AI can present the new city immediately after
    // calling advance_round (without needing an extra round-trip).
    const advanceSignal = isNextRoundSignal(messages);
    const promptRound = advanceSignal ? roundNumber + 1 : roundNumber;
    const roundSeed = sessionSeedVal + promptRound;

    // Compute exclude list for the prompt round (excludes all cities before it).
    const previousRoundExcludeIds: string[] = [];
    for (let r = 0; r < promptRound; r++) {
      const { city } = getCityForRound(previousRoundExcludeIds, sessionSeedVal + r);
      previousRoundExcludeIds.push(city.id);
    }

    // Get the city for the prompt round (for tool validation + system prompt)
    const { city: currentCity } = getCityForRound(previousRoundExcludeIds, roundSeed);
    const tools = buildTools(currentCity.nameAr, currentCity.id);

    const systemPrompt = buildSystemPrompt(
      difficulty || "medium",
      kidsProfile?.age || 8,
      kidsProfile?.name,
      chatContext,
      previousRoundExcludeIds,
      roundSeed
    );

    // For display/trimming: include all discovered cities (current + previous)
    const sessionCityIds = extractUsedCityIds(messages);
    const allUsedCityIds = Array.from(
      new Set([...(discoveredCityIds || []), ...sessionCityIds])
    );

    console.log("[city-explorer] Round city:", currentCity.nameAr, "(" + currentCity.name + ")");

    // Trim old-round messages (saves 3k-10k+ tokens per request)
    let aiMessages = messages;
    if (trimCompletedRounds && roundNumber > 0) {
      const discoveredNames = allUsedCityIds
        .map((id) => CITIES.find((c) => c.id === id)?.nameAr)
        .filter(Boolean) as string[];
      aiMessages = trimCompletedRoundMessages(messages, roundSeed, discoveredNames);
      console.log("[game-chat] Trimmed messages", {
        original: messages.length,
        trimmed: aiMessages.length,
        round: roundSeed + 1,
      });
    }

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(aiMessages),
      tools,
      stopWhen: stepCountIs(3),
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[game-chat] Stream finished", {
          textLength: text.length,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
        });
      },
    });

    return result.toUIMessageStreamResponse();
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
