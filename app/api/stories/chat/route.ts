import { NextRequest } from "next/server";
import { generateText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModel } from "@/lib/ai/config";
import { buildStoryTools } from "@/lib/ai/stories/tools";
import { buildStorySystemPrompt } from "@/lib/ai/stories/prompts";
import { StoryConfig, StoryPage } from "@/lib/types/stories";
import { KidsProfile } from "@/lib/types/games";
import { logError } from "@/lib/utils/error-handler";
import { buildCacheOptions, formatCacheUsage } from "@/lib/ai/cache";

type StoryChatRequest = {
  messages: UIMessage[];
  storyConfig: StoryConfig;
  kidsProfile?: KidsProfile;
  previousPages?: StoryPage[];
  lastChoiceText?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StoryChatRequest;
    const { messages = [], storyConfig, kidsProfile, previousPages, lastChoiceText } = body;

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
      kidsProfile?.age || 8,
      previousPages,
      lastChoiceText
    );

    const tools = buildStoryTools(storyConfig.mode !== "continuous");

    console.log("[stories] Config:", storyConfig);
    console.log("[stories] System prompt length:", systemPrompt.length);
    if (previousPages?.length) {
      console.log("[stories] Continuing from page", previousPages.length);
    }

    const cacheKey = `story-${storyConfig.genre}-${storyConfig.setting}-${storyConfig.mode}`;

    const result = await generateText({
      model: openai(getModel()),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(20),
      ...buildCacheOptions(cacheKey),
    });

    const cache = formatCacheUsage(result.usage as Record<string, unknown>);
    console.log("[stories] Generation finished", {
      stepsCount: result.steps.length,
      ...(cache && { cache }),
    });

    // Collect all tool results across all steps
    const pages: StoryPage[] = [];
    let choicePoint: { prompt: string; choices: { id: string; emoji: string; textAr: string }[] } | null = null;
    let ended: { titleAr: string; closingMessage: string } | null = null;

    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        if (tr.toolName === "story_page") {
          const r = tr.result as { pageNumber: number; text: string };
          pages.push({ pageNumber: r.pageNumber, text: r.text });
        } else if (tr.toolName === "story_choice") {
          const r = tr.result as { prompt: string; choices: { id: string; emoji: string; textAr: string }[] };
          choicePoint = { prompt: r.prompt, choices: r.choices };
        } else if (tr.toolName === "end_story") {
          const r = tr.result as { titleAr: string; closingMessage: string };
          ended = { titleAr: r.titleAr, closingMessage: r.closingMessage };
        }
      }
    }

    return Response.json({ pages, choicePoint, ended });
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
