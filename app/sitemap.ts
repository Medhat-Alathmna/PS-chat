import type { MetadataRoute } from "next";
import { GAME_CONFIGS } from "@/lib/data/games";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ps-kids.school";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/kids`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/chat`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/kids/games`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/kids/games/stories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/kids/world-explorer`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const gameRoutes: MetadataRoute.Sitemap = Object.keys(GAME_CONFIGS).map((gameId) => ({
    url: `${SITE_URL}/kids/games/${gameId}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...gameRoutes];
}
