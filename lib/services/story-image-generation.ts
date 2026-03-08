import OpenAI from "openai";

function getImageClient(): { client: OpenAI; model: string } {
  const model = process.env.STORIES_IMAGES_PROVIDER || "";
  if (!model) throw new Error("STORIES_IMAGES_PROVIDER is not configured");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  return {
    client: new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" }),
    model,
  };
}

function buildImagePrompt(imagePrompt: string, heroDescription?: string): string {
  const style = process.env.STORY_IMAGE_STYLE || "cartoon";
  const hero = heroDescription ? `. Hero appearance: ${heroDescription}` : "";
  return `${imagePrompt}${hero}. ${style} style, children's book illustration, warm colors, safe for children, no text.`;
}

/** True for chat-based image gen models (Gemini image preview, etc.) */
function isChatImageModel(model: string): boolean {
  return model.includes("gemini") && model.includes("image");
}

/**
 * Generate via /v1/images/generations (FLUX, Stable Diffusion, etc. on OpenRouter).
 * Returns base64 data URL.
 */
async function generateViaImagesEndpoint(
  client: OpenAI,
  model: string,
  prompt: string
): Promise<string | null> {
  const response = await client.images.generate({
    model,
    prompt,
    n: 1,
    response_format: "b64_json",
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) return null;
  console.log(`data:image/png;base64,${b64}`);
  
  return `data:image/png;base64,${b64}`;
}

/**
 * Generate via /v1/chat/completions — for Gemini image preview models on OpenRouter
 * that output images in multimodal chat responses.
 * Uses raw fetch so we can inspect the exact HTTP response.
 */
async function generateViaChatEndpoint(
  _client: OpenAI,
  model: string,
  prompt: string
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY!;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  const rawText = await res.text();
  console.log(`[story-image-chat] HTTP ${res.status} | raw:\n${rawText.slice(0, 800)}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${rawText.slice(0, 200)}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try { data = JSON.parse(rawText); } catch {
    throw new Error(`Invalid JSON: ${rawText.slice(0, 100)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  console.log(`[story-image-chat] content type=${typeof content} isArray=${Array.isArray(content)} value=${JSON.stringify(content)?.slice(0, 400)}`);

  if (!content) throw new Error("No content in response");
  if (typeof content === "string" && content.startsWith("data:")) return content;

  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url") {
        const url = part.image_url?.url as string | undefined;
        if (url) return url;
      }
      if (part.type === "image") {
        const data64 = part.source?.data ?? part.data;
        if (data64) return `data:image/png;base64,${data64}`;
      }
    }
    throw new Error(`No image part found in content array: ${JSON.stringify(content).slice(0, 200)}`);
  }

  throw new Error(`Unexpected content format: ${typeof content}`);
}

export async function generateStoryPageImage(
  imagePrompt: string,
  heroDescription?: string
): Promise<string | null> {
  const { client, model } = getImageClient();
  const enrichedPrompt = buildImagePrompt(imagePrompt, heroDescription);
  const path = isChatImageModel(model) ? "chat-completions" : "images-endpoint";


  try {
    const result = isChatImageModel(model)
      ? await generateViaChatEndpoint(client, model, enrichedPrompt)
      : await generateViaImagesEndpoint(client, model, enrichedPrompt);
    return result;
  } catch (err) {
    console.error(`[story-image] Error via ${path}:`, err);
    throw err;
  }
}
