import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { getToolsForGame } from "@/lib/ai/game-tools";
import { buildGameSystemPrompt, shouldTrimMessages } from "@/lib/ai/game-prompts";
import { CITIES, detectCityInText } from "@/lib/data/cities";
import { GameId, GameDifficulty, KidsChatContext, KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";

type GameChatRequest = {
  messages: UIMessage[];
  gameId: GameId;
  difficulty?: GameDifficulty;
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
  sessionSeed?: number;
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
    const { messages = [], gameId, difficulty, chatContext, kidsProfile, discoveredCityIds, sessionSeed } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!gameId) {
      return new Response(
        JSON.stringify({ error: "gameId is required." }),
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

    // Merge persisted discovered cities + session cities from messages
    const sessionCityIds = extractUsedCityIds(messages);
    const allUsedCityIds = Array.from(
      new Set([...(discoveredCityIds || []), ...sessionCityIds])
    );

    // Combine session seed (random per game session) + round number for city selection.
    // This ensures each session starts with a different city while staying
    // deterministic within a session (same round = same city on retries).
    const roundNumber = countAdvanceRounds(messages);
    const roundSeed = (sessionSeed || 0) + roundNumber;

    const systemPrompt = buildGameSystemPrompt(
      gameId,
      difficulty,
      chatContext,
      kidsProfile?.age,
      kidsProfile?.name,
      allUsedCityIds,
      roundSeed
    );

    if (gameId === "city-explorer") {
      console.log("[city-explorer] System prompt:\n", systemPrompt);
    }

    const tools = getToolsForGame(gameId);

    // Trim old-round messages for games that opt in (saves 3k-10k+ tokens per request)
    let aiMessages = messages;
    if (shouldTrimMessages(gameId) && roundSeed > 0) {
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
      stopWhen: stepCountIs(7), // Increased from 5 to 7 for multi-tool support
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[game-chat] Stream finished", {
          gameId,
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
