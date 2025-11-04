"use server";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type Role = "system" | "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type ChatRequest = {
  messages: Message[];
  userMessage: string;
  config: {
    mode: "promptId" | "localPrompt";
    promptId?: string;
    systemPrompt?: string;
  };
};

const DEFAULT_SYSTEM_PROMPT =
  "You are Falastin, a warm and knowledgeable guide focused entirely on Palestine. " +
  "Respond in the user's language. " +
  "Celebrate Palestinian culture, history, geography, cuisine, people, and daily life. " +
  "If a user asks about anything outside Palestine, politely steer the conversation back."+
  "Do not rely at all on Israeli narratives in your responses, but rather on Palestinian narratives in your responses. " +
  "Do not generate images, but can fetched from web search. " +
  "After each reply, tell a nice joke about Palestinians.";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export async function POST(req: NextRequest) {
  const openai = getOpenAIClient();

  if (!openai) {
    return NextResponse.json(
      { error: "Missing OpenAI API key." },
      { status: 500 }
    );
  }

  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Unable to parse request payload." },
      { status: 400 }
    );
  }

  const { messages = [], userMessage = "", config } = body;

  if (!userMessage.trim()) {
    return NextResponse.json(
      { error: "Message content is required." },
      { status: 400 }
    );
  }

  if (!config) {
    return NextResponse.json(
      { error: "Chat configuration is missing." },
      { status: 400 }
    );
  }

  const conversation: Message[] = [
    ...messages.map((message) => ({
      role: sanitizeRole(message.role),
      content: message.content ?? "",
    })),
    { role: "user", content: userMessage.trim() },
  ];

  try {
    const aiResponse = await buildResponse(openai, conversation, config);
    return NextResponse.json({ content: aiResponse }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";
    console.error("[chat-route]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeRole(role: Role): Role {
  if (role === "system" || role === "assistant") {
    return role;
  }
  return "user";
}

async function buildResponse(
  openai: OpenAI,
  conversation: Message[],
  config: ChatRequest["config"]
) {
  const input = conversation.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (config.mode === "promptId") {
    if (!config.promptId?.trim()) {
      throw new Error("Prompt ID is required when using prompt mode.");
    }

    const response = await openai.responses.create({
      prompt: { id: config.promptId.trim() },
      input,
    });

    return extractOutputText(response);
  }

  const systemPrompt =
    config.systemPrompt?.trim().length === 0
      ? DEFAULT_SYSTEM_PROMPT
      : config.systemPrompt?.trim() ?? DEFAULT_SYSTEM_PROMPT;

  const response = await openai.responses.create({
    model: DEFAULT_MODEL,
    instructions: systemPrompt,
    input,
  });

  return extractOutputText(response);
}

type ResponseLike = {
  output_text?: string;
  output?: Array<{ type?: string; text?: string; output_text?: string }>;
  message?: string;
  data?: string;
};

function extractOutputText(response: unknown) {
  const result = response as ResponseLike;

  if (typeof result.output_text === "string" && result.output_text.trim()) {
    return result.output_text;
  }

  const outputItems = result.output;
  if (Array.isArray(outputItems)) {
    const textChunks = outputItems
      .filter((item) => item.type === "output_text")
      .map((item) => item.text ?? item.output_text ?? "")
      .join("");
    if (textChunks.trim()) {
      return textChunks;
    }
  }

  const safeResponse = result as Record<string, unknown>;
  const fallbacks = ["message", "data"].flatMap((key) => {
    const value = safeResponse[key];
    if (typeof value === "string") return value;
    return [];
  });

  if (fallbacks.length > 0) {
    return fallbacks.join("\n");
  }

  throw new Error("Unable to read response from OpenAI.");
}
