"use server";

import { NextRequest } from "next/server";
import { generateText, UIMessage, convertToModelMessages } from "ai";
import { buildWorldExplorerSystemPrompt } from "@/lib/ai/world-explorer";
import { getMainChatModelInstance } from "@/lib/ai/config";
import { COUNTRIES_BY_ID } from "@/lib/data/countries";
import { extractChipsFromText } from "@/lib/utils/messageConverter";
import { logError } from "@/lib/utils/error-handler";

type WorldExplorerRequest = {
  messages: UIMessage[];
  countryId: string;
  playerName?: string;
};

/**
 * POST /api/world-explorer/chat
 * Medhat explains a world country to a child.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WorldExplorerRequest;
    const { messages = [], countryId, playerName } = body;

    if (!countryId) {
      return Response.json({ error: "countryId is required" }, { status: 400 });
    }

    const country = COUNTRIES_BY_ID.get(countryId);
    if (!country) {
      return Response.json({ error: "Unknown country" }, { status: 400 });
    }

    const systemPrompt = buildWorldExplorerSystemPrompt(country, playerName);
    // Keep last 6 messages to avoid token bloat while maintaining context
    const convertedMessages = await convertToModelMessages(messages.slice(-6));

    const result = await generateText({
      model: getMainChatModelInstance(),
      system: systemPrompt,
      messages: convertedMessages,
    });

    const chips = extractChipsFromText(result.text);
    const chipsPos = result.text.search(/\nCHIPS:/i);
    const text =
      chipsPos >= 0 ? result.text.slice(0, chipsPos).trim() : result.text;

    return Response.json({
      text,
      chips: chips?.chips ?? [],
    });
  } catch (error) {
    logError("world-explorer-chat", error);
    return Response.json(
      { error: "حدث خطأ. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
