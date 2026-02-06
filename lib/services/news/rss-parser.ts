import { NewsItem, ToolResult } from "@/lib/types";

// Palestinian news RSS sources
const NEWS_SOURCES = [
  {
    name: "وكالة معا",
    url: "https://www.maannews.net/rss/LatestNews.xml",
    category: "general",
  },
  {
    name: "وكالة وفا",
    url: "https://wafa.ps/ar/rss.aspx",
    category: "general",
  },
  {
    name: "شبكة قدس",
    url: "https://www.qudsn.net/feed/",
    category: "general",
  },
];

/**
 * Fetch and parse news from Palestinian RSS feeds
 */
export async function fetchPalestinianNews(
  query?: string,
  limit: number = 5
): Promise<ToolResult<NewsItem[]>> {
  try {
    const allNews: NewsItem[] = [];

    // Try to fetch from each source
    for (const source of NEWS_SOURCES) {
      try {
        const news = await fetchFromSource(source);
        allNews.push(...news);
      } catch (error) {
        console.warn(`[news] Failed to fetch from ${source.name}:`, error);
        continue;
      }
    }

    // If RSS fails, return mock Palestinian news
    if (allNews.length === 0) {
      return {
        success: true,
        data: getMockNews(query, limit),
        fallbackUsed: true,
      };
    }

    // Filter by query if provided
    let filteredNews = allNews;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredNews = allNews.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          (item.description?.toLowerCase().includes(lowerQuery) ?? false)
      );
    }

    // Sort by date and limit
    filteredNews.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return {
      success: true,
      data: filteredNews.slice(0, limit),
    };
  } catch (error) {
    console.error("[news] Error:", error);
    return {
      success: true,
      data: getMockNews(query, limit),
      fallbackUsed: true,
    };
  }
}

/**
 * Fetch news from a single RSS source
 */
async function fetchFromSource(source: {
  name: string;
  url: string;
  category: string;
}): Promise<NewsItem[]> {
  const response = await fetch(source.url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  return parseRSS(xml, source.name, source.category);
}

/**
 * Simple RSS XML parser
 */
function parseRSS(xml: string, sourceName: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Simple regex-based parsing (works for most RSS feeds)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const description = extractTag(itemXml, "description");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const imageUrl = extractImageFromXml(itemXml);

    if (title && link) {
      items.push({
        id: `${sourceName}-${items.length}`,
        title: cleanHtml(title),
        description: description ? cleanHtml(description).slice(0, 200) : undefined,
        url: link,
        source: sourceName,
        imageUrl,
        publishedAt: pubDate || new Date().toISOString(),
        category,
      });
    }
  }

  return items;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tag: string): string | undefined {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const simpleMatch = xml.match(simpleRegex);
  return simpleMatch ? simpleMatch[1].trim() : undefined;
}

/**
 * Extract image URL from RSS item
 */
function extractImageFromXml(xml: string): string | undefined {
  // Try media:content
  const mediaMatch = xml.match(/url=["']([^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)/i);
  if (mediaMatch) return mediaMatch[1];

  // Try enclosure
  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try image in content
  const imgMatch = xml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : undefined;
}

/**
 * Clean HTML entities and tags
 */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Get mock Palestinian news when RSS fails
 */
function getMockNews(query?: string, limit: number = 5): NewsItem[] {
  const mockNews: NewsItem[] = [
    {
      id: "mock-1",
      title: "أنشطة ثقافية فلسطينية تحتفي بالتراث الوطني",
      description: "تنظم المؤسسات الثقافية الفلسطينية فعاليات للحفاظ على التراث والهوية الوطنية",
      url: "https://example.com/culture",
      source: "أخبار فلسطين",
      publishedAt: new Date().toISOString(),
      category: "ثقافة",
    },
    {
      id: "mock-2",
      title: "معرض للتطريز الفلسطيني في رام الله",
      description: "افتتاح معرض يضم أعمال فنية من التطريز الفلسطيني التقليدي",
      url: "https://example.com/art",
      source: "أخبار فلسطين",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      category: "فن",
    },
    {
      id: "mock-3",
      title: "مهرجان الزيتون السنوي في نابلس",
      description: "انطلاق موسم قطف الزيتون في المدن والقرى الفلسطينية",
      url: "https://example.com/olive",
      source: "أخبار فلسطين",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      category: "محلي",
    },
    {
      id: "mock-4",
      title: "المطبخ الفلسطيني يتألق في معرض الغذاء الدولي",
      description: "المأكولات الفلسطينية التقليدية تحظى باهتمام واسع في المحافل الدولية",
      url: "https://example.com/food",
      source: "أخبار فلسطين",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      category: "ثقافة",
    },
    {
      id: "mock-5",
      title: "ترميم المباني التاريخية في البلدة القديمة",
      description: "جهود متواصلة للحفاظ على المعالم التاريخية في المدن الفلسطينية",
      url: "https://example.com/heritage",
      source: "أخبار فلسطين",
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      category: "تراث",
    },
  ];

  if (query) {
    const lowerQuery = query.toLowerCase();
    return mockNews
      .filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          (item.description?.toLowerCase().includes(lowerQuery) ?? false)
      )
      .slice(0, limit);
  }

  return mockNews.slice(0, limit);
}
