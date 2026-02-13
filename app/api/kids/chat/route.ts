"use server";

import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildKidsSystemPrompt, getModel } from "@/lib/ai/config";
import { kidsTools } from "@/lib/ai/tools";
import { logError } from "@/lib/utils/error-handler";

type KidsChatRequest = {
  messages: UIMessage[];
  config?: {
    mode: "promptId" | "localPrompt";
    systemPrompt?: string;
  };
  playerName?: string;
};

/**
 * POST /api/kids/chat - Handle kids chat requests with limited tools
 * Uses only image_search and location_search with conversational behavior
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as KidsChatRequest;
    const { messages = [], config, playerName } = body;

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

    // Use kids-specific system prompt (conversational tool usage)
    const systemPrompt =
      config?.mode === "localPrompt" && config.systemPrompt?.trim()
        ? config.systemPrompt
        : buildKidsSystemPrompt(playerName);

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: kidsTools, // Only image_search + location_search
      stopWhen: stepCountIs(5), // Allow more steps for tool calls + complete response
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[kids-chat] Stream finished", {
          textLength: text.length,
          toolCallsCount: toolCalls?.length || 0,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError("kids-chat-route", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ. يرجى المحاولة مرة أخرى." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
