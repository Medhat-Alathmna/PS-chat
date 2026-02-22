"use server";

import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildMainSystemPrompt } from "@/lib/ai/main";
import { getModel } from "@/lib/ai/config";
import { kidsTools, timelineSearchTool } from "@/lib/ai/tools";
import { logError } from "@/lib/utils/error-handler";

const mainTools = {
  ...kidsTools,
  timeline_search: timelineSearchTool,
};

type KidsChatRequest = {
  messages: UIMessage[];
  config?: {
    mode: "promptId" | "localPrompt";
    systemPrompt?: string;
  };
  playerName?: string;
};

/**
 * POST /api/chat - Main chat agent (Medhat)
 * Tools: image_search, location_search, suggest_replies, timeline_search
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

    const systemPrompt =
      config?.mode === "localPrompt" && config.systemPrompt?.trim()
        ? config.systemPrompt
        : buildMainSystemPrompt(playerName);

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: mainTools,
      stopWhen: stepCountIs(5), // Allow more steps for tool calls + complete response
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[main-chat] Stream finished", {
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
