"use server";

import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { getToolsForGame } from "@/lib/ai/game-tools";
import { buildGameSystemPrompt } from "@/lib/ai/game-prompts";
import { GameId, GameDifficulty, GameState, KidsChatContext, KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";

type GameChatRequest = {
  messages: UIMessage[];
  gameId: GameId;
  difficulty?: GameDifficulty;
  gameState?: GameState;
  chatContext?: KidsChatContext;
  kidsProfile?: KidsProfile;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GameChatRequest;
    const { messages = [], gameId, difficulty, chatContext, kidsProfile } = body;

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

    const systemPrompt = buildGameSystemPrompt(
      gameId,
      difficulty,
      chatContext,
      kidsProfile?.age,
      kidsProfile?.name
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
