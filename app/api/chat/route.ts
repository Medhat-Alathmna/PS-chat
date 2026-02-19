"use server";

import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/ai/main";
import { getModel } from "@/lib/ai/config";
import { allTools } from "@/lib/ai/tools";
import { logError } from "@/lib/utils/error-handler";

// Type for AI SDK request format
type AISDKRequest = {
  messages: UIMessage[];
  config?: {
    mode: "promptId" | "localPrompt";
    promptId?: string;
    systemPrompt?: string;
  };
};

/**
 * POST /api/chat - Handle chat requests with streaming and tool calling support
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body - AI SDK sends messages array directly
    const body = (await req.json()) as AISDKRequest;
    const { messages = [], config } = body;

    // Validation - check if we have messages
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API key." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create OpenAI client
    const openai = createOpenAI({
      apiKey,
    });

    // Determine system prompt
    const systemPrompt =
      config?.mode === "localPrompt"
        ? config.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT
        : DEFAULT_SYSTEM_PROMPT;

    // Stream the response with tools
    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: allTools,
      stopWhen: stepCountIs(5), // Allow up to 5 tool calls per request
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[chat] Stream finished", {
          textLength: text.length,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
        });
      },
    });

    // Return the stream using UI message format
    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError("chat-route", error);
    return new Response(
      JSON.stringify({
        error: "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
