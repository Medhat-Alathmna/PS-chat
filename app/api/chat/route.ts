"use server";

import { NextRequest } from "next/server";
import {
  generateText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { buildMainSystemPrompt } from "@/lib/ai/main";
import { getMainChatModelInstance } from "@/lib/ai/config";
import { kidsTools } from "@/lib/ai/tools";
import { isImagesEnabled } from "@/lib/config/features";
import { enforceQuota, recordUsage } from "@/lib/api/token-quota";
import { logError } from "@/lib/utils/error-handler";
import { extractChipsFromText } from "@/lib/utils/messageConverter";
import { buildCacheOptions } from "@/lib/ai/cache";

function buildMainTools() {
  const { image_search, ...kidsToolsWithoutImages } = kidsTools;
  return isImagesEnabled() ? kidsTools : kidsToolsWithoutImages;
}

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
 * Tools: image_search, location_search
 * Chips generated via Output.object (parallel with text — no extra tool round-trip)
 */
export async function POST(req: NextRequest) {
  try {
    const quotaResult = await enforceQuota("chat");
    if ("response" in quotaResult) return quotaResult.response;
    const { quota } = quotaResult;

    const body = (await req.json()) as KidsChatRequest;
    const { messages = [], config, playerName } = body;

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      config?.mode === "localPrompt" && config.systemPrompt?.trim()
        ? config.systemPrompt
        : buildMainSystemPrompt(playerName);

    const convertedMessages = await convertToModelMessages(messages.slice(-3));

    const result = await generateText({
      model: getMainChatModelInstance(),
      system: systemPrompt,
      messages: convertedMessages,
      tools: buildMainTools(),
      ...buildCacheOptions("main-chat"),
    });

    const updatedQuota = await recordUsage(quota, result.usage?.totalTokens ?? 0, "chat");

    const chips = extractChipsFromText(result.text);

    // Strip CHIPS suffix from display text
    const chipsPos = result.text.search(/\nCHIPS:/i);
    const textContent = chipsPos >= 0 ? result.text.slice(0, chipsPos).trim() : result.text;

    return Response.json({
      text: textContent,
      chips: chips?.chips || [],
      finishReason: result.finishReason,
      usage: result.usage,
      quota: updatedQuota,
    });
  } catch (error) {
    logError("kids-chat-route", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ. يرجى المحاولة مرة أخرى." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
