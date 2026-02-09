import { getOpenAIClient } from "@/lib/ai/config";

const MAX_TEXT_LENGTH = 4000;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const input = text.slice(0, MAX_TEXT_LENGTH);
    const client = getOpenAIClient();

    const response = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      speed: 0.8,
      input,
      instructions:
        "You are a 10-year-old kid talking to your best friend. Sound excited, playful, and natural like a real child. Keep a high-pitched, youthful voice. When speaking Arabic, pronounce words clearly but stay energetic and fun.",
    });

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
