import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ps-kids.school";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/settings", "/map-settings"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
