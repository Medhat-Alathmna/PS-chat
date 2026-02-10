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

    let tools = getToolsForGame(gameId);

    // When the player asks for a hint, restrict tools to only give_hint
    // This prevents the AI from also calling check_answer or present_options
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    let lastUserText = "";
    if (lastUserMsg) {
      if (typeof lastUserMsg.content === "string") {
        lastUserText = lastUserMsg.content.trim();
      } else if (Array.isArray(lastUserMsg.parts)) {
        // UIMessage v5 uses parts array with { type: "text", text: "..." }
        const textPart = lastUserMsg.parts.find(
          (p: Record<string, unknown>) => p.type === "text"
        ) as { text?: string } | undefined;
        lastUserText = textPart?.text?.trim() || "";
      }
    }
    console.log("[game-chat] lastUserText:", JSON.stringify(lastUserText), "from msg:", JSON.stringify(lastUserMsg?.content?.toString().slice(0, 100)));
    const isHintRequest = lastUserText === "تلميح" || lastUserText.toLowerCase() === "hint";
    if (isHintRequest && tools.give_hint) {
      console.log("[game-chat] HINT REQUEST detected — restricting tools to give_hint only");
      tools = { give_hint: tools.give_hint, end_game: tools.end_game };
    }

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(isHintRequest ? 2 : 5),
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
