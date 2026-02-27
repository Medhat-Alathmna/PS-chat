"use server";

import { NextRequest } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { buildMainSystemPrompt } from "@/lib/ai/main";
import { getModel } from "@/lib/ai/config";
import { kidsTools, timelineSearchTool } from "@/lib/ai/tools";
import { logError } from "@/lib/utils/error-handler";
import { extractChipsFromText } from "@/lib/utils/messageConverter";
import { buildCacheOptions, formatCacheUsage } from "@/lib/ai/cache";

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
 * Tools: image_search, location_search, timeline_search
 * Chips generated via Output.object (parallel with text — no extra tool round-trip)
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

    const convertedMessages = await convertToModelMessages(messages);

    const uiStream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model: openai(getModel()),
          system: systemPrompt,
          messages: convertedMessages,
          tools: mainTools,
          ...buildCacheOptions("main-chat"),
          onStepFinish: ({ toolCalls, toolResults }) => {
            if (toolCalls?.length) {
              for (const call of toolCalls) {
                const result = toolResults?.find((r) => r.toolCallId === call.toolCallId);
                console.log("[main-chat] Tool call", {
                  tool: call.toolName,
                  args: call.args,
                  result: result?.result,
                });
              }
            }
          },
          onFinish: async ({ text, toolCalls, usage }) => {
            const cache = formatCacheUsage(usage as Record<string, unknown>);
            console.log("[main-chat] Stream finished", {
              textLength: text.length,
              toolCallsCount: toolCalls?.length || 0,
              ...(cache && { cache }),
            });
          },
        });

        writer.merge(result.toUIMessageStream());

        try {
          const chips = extractChipsFromText(await result.text);
          if (chips) writer.write({ type: "data-chips", data: chips });
        } catch {
          // Chips parse failed — skip gracefully
        }
      },
    });

    return createUIMessageStreamResponse({ stream: uiStream });
  } catch (error) {
    logError("kids-chat-route", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ. يرجى المحاولة مرة أخرى." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
