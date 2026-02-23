import { NextRequest } from "next/server";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { buildStoryTools } from "@/lib/ai/stories/tools";
import { buildStorySystemPrompt } from "@/lib/ai/stories/prompts";
import { StoryConfig } from "@/lib/types/stories";
import { KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";

type StoryChatRequest = {
  messages: UIMessage[];
  storyConfig: StoryConfig;
  kidsProfile?: KidsProfile;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StoryChatRequest;
    const { messages = [], storyConfig, kidsProfile } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message content is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!storyConfig) {
      return new Response(
        JSON.stringify({ error: "Story config is required." }),
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

    const systemPrompt = buildStorySystemPrompt(
      storyConfig,
      kidsProfile?.name,
      kidsProfile?.age || 8
    );

    const tools = buildStoryTools(storyConfig.mode !== "continuous");

    console.log("[stories] Config:", storyConfig);
    console.log("[stories] System prompt length:", systemPrompt.length);

    const result = streamText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(15),
      onFinish: async ({ text, toolCalls, toolResults }) => {
        console.log("[stories] Stream finished", {
          textLength: text.length,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError("stories-chat-route", error);
    return new Response(
      JSON.stringify({
        error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
