import { NextRequest } from "next/server";
import { generateText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { getStoriesModelInstance } from "@/lib/ai/config";
import { buildStoryTools } from "@/lib/ai/stories/tools";
import { buildStorySystemPrompt } from "@/lib/ai/stories/prompts";
import { StoryConfig, StoryPage } from "@/lib/types/stories";
import { KidsProfile } from "@/lib/types/games";
import { enforceQuota, recordUsage } from "@/lib/api/token-quota";
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
  console.log("[stories-route] ===== POST called =====");
  try {
    const quotaResult = await enforceQuota("stories");
    if ("response" in quotaResult) return quotaResult.response;
    const { quota } = quotaResult;

    const body = (await req.json()) as StoryChatRequest;
    const { messages = [], storyConfig, kidsProfile, previousPages, lastChoiceText } = body;

    if (messages.length === 0) {
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

    const systemPrompt = buildStorySystemPrompt(
      storyConfig,
      kidsProfile?.name,
      kidsProfile?.age || 8,
      previousPages,
      lastChoiceText
    );

    const tools = buildStoryTools(storyConfig.mode !== "continuous");

    const cacheKey = `story-${storyConfig.genre}-${storyConfig.mode}`;

    const result = await generateText({
      model: getStoriesModelInstance(),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature:1,
      tools,
      stopWhen: stepCountIs(20),
      ...buildCacheOptions(cacheKey),
    });

    const updatedQuota = await recordUsage(quota, result.usage?.totalTokens ?? 0, "stories");

    const cache = formatCacheUsage(result.usage as Record<string, unknown>);
    console.log("[stories] Generation finished", {
      stepsCount: result.steps.length,
      ...(cache && { cache }),
    });

    // Collect all tool results across all steps
    const pages: StoryPage[] = [];
    let choicePoint: { prompt: string; choices: { id: string; emoji: string; textAr: string }[] } | null = null;
    let ended: { titleAr: string; closingMessage: string; moralLesson?: string } | null = null;

    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        if (tr.toolName === "story_page") {
          const r = (tr as any).output as { pageNumber: number; text: string; imagePrompt?: string; heroDescription?: string; illustrate?: boolean };
          console.log(`[stories-route] page ${r.pageNumber} — imagePrompt: ${r.imagePrompt ? "YES" : "NO"} | illustrate: ${r.illustrate}`);
          pages.push({ pageNumber: r.pageNumber, text: r.text, imagePrompt: r.imagePrompt, heroDescription: r.heroDescription, illustrate: r.illustrate });
        } else if (tr.toolName === "story_choice") {
          const r = (tr as any).output as { prompt: string; choices: { id: string; emoji: string; textAr: string }[] };
          choicePoint = { prompt: r.prompt, choices: r.choices };
        } else if (tr.toolName === "end_story") {
          const r = (tr as any).output as { titleAr: string; closingMessage: string; moralLesson?: string };
          ended = { titleAr: r.titleAr, closingMessage: r.closingMessage, moralLesson: r.moralLesson };
        }
      }
    }

    return Response.json({ pages, choicePoint, ended, quota: updatedQuota });
  } catch (error) {
    logError("stories-chat-route", error);
    const isDev = process.env.NODE_ENV === "development";
    return new Response(
      JSON.stringify({
        error: isDev && error instanceof Error ? error.message : "حدث خطأ. يرجى المحاولة مرة أخرى.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
