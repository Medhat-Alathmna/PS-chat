import { NextRequest } from "next/server";
import { StoryPage } from "@/lib/types/stories";
import { generateStoryPageImage } from "@/lib/services/story-image-generation";
import { isImagesEnabled } from "@/lib/config/features";

type StoryImagesRequest = {
  pages: StoryPage[];
};

export async function POST(req: NextRequest) {
  try {
    if (!isImagesEnabled()) return Response.json({ imageUrls: {} });
    const { pages } = (await req.json()) as StoryImagesRequest;
    if (!pages?.length) return Response.json({ imageUrls: {} });

    const imagesPerStory = parseInt(process.env.IMAGES_PER_STORY || "3");
    const heroDescription = pages.find((p) => p.heroDescription)?.heroDescription;

    // Select pages to illustrate: AI-flagged first, fallback to first/middle/last
    let toIllustrate = pages.filter((p) => p.illustrate && p.imagePrompt);
    if (toIllustrate.length === 0) {
      const withPrompts = pages.filter((p) => p.imagePrompt);
      if (withPrompts.length > 0) {
        const indices = new Set([0, Math.floor(withPrompts.length / 2), withPrompts.length - 1]);
        toIllustrate = [...indices].map((i) => withPrompts[i]);
      }
    }

    const batch = toIllustrate.slice(0, imagesPerStory);
    if (batch.length === 0) return Response.json({ imageUrls: {} });

    console.log(`[stories-images] Generating ${batch.length} images | model: ${process.env.STORIES_IMAGES_PROVIDER}`);

    const results = await Promise.allSettled(
      batch.map((p) => generateStoryPageImage(p.imagePrompt!, heroDescription))
    );

    const imageUrls: Record<string, string> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        imageUrls[String(batch[i].pageNumber)] = r.value;
      } else {
        console.warn(`[stories-images] page ${batch[i].pageNumber} failed:`,
          r.status === "rejected" ? r.reason : "null");
      }
    });

    console.log(`[stories-images] Done — ${Object.keys(imageUrls).length}/${batch.length} succeeded`);
    return Response.json({ imageUrls });
  } catch (error) {
    console.error("[stories-images] Error:", error);
    return Response.json({ imageUrls: {} });
  }
}
