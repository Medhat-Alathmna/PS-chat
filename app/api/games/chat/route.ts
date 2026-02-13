"use server";

import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { getToolsForGame } from "@/lib/ai/game-tools";
import { buildGameSystemPrompt } from "@/lib/ai/game-prompts";
import { GameId, GameDifficulty, GameState, KidsChatContext, KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";
import { detectCityInText } from "@/lib/data/cities";

type GameChatRequest = {
  messages: UIMessage[];
  gameId: GameId;
  difficulty?: GameDifficulty;
  gameState?: GameState;
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
  discoveredCityIds?: string[];
};

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GameChatRequest;
    const { messages = [], gameId, difficulty, chatContext, kidsProfile, discoveredCityIds } = body;

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

    const systemPrompt = buildGameSystemPrompt(
      gameId,
      difficulty,
      chatContext,
      kidsProfile?.age,
      kidsProfile?.name,
      allUsedCityIds
    );

    const tools = getToolsForGame(gameId);

    // NEW: No tool restrictions! AI can use multiple tools for richer experiences
    // Multi-tool combinations are now encouraged (e.g., check_answer + image_search)

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
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
