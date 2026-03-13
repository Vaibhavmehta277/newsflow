import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { Article } from "@/types";
import { RSS_SOURCES, detectKeywords } from "./keywords";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; NewsFlowBot/1.0; +https://newsflow.app)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
});

interface ParsedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  enclosure?: { url?: string };
}

function extractImage(item: ParsedItem): string | undefined {
  return (
    item.mediaContent?.$?.url ||
    item.mediaThumbnail?.$?.url ||
    item.enclosure?.url ||
    undefined
  );
}

function cleanSummary(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

async function fetchSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const articles: Article[] = [];

    for (const item of (feed.items || []).slice(0, 20)) {
      const title = item.title?.trim() || "";
      const url = item.link?.trim() || "";
      if (!title || !url) continue;

      const rawText = `${title} ${item.contentSnippet || item.summary || ""}`;
      const { keywords, category } = detectKeywords(rawText);

      // For high-priority (voice-ai) sources, include all items
      // For medium-priority, only include if keyword matched beyond generic ai
      if (
        source.priority === "medium" &&
        category === "ai-news" &&
        keywords.length === 0
      ) {
        continue;
      }

      const summary = cleanSummary(
        item.contentSnippet || item.summary || item.content || ""
      );
      const publishedAt =
        item.isoDate || item.pubDate
          ? new Date(item.isoDate || item.pubDate || "").toISOString()
          : new Date().toISOString();

      articles.push({
        id: uuidv4(),
        title,
        source: source.name,
        sourceSlug: source.slug,
        url,
        publishedAt,
        summary,
        keywords:
          keywords.length > 0
            ? keywords
            : [source.category.replace("-", " ")],
        category: keywords.length > 0 ? category : source.category,
        imageUrl: extractImage(item as ParsedItem),
      });
    }

    return articles;
  } catch {
    console.warn(`Failed to fetch ${source.name}:`, source.url);
    return [];
  }
}

// Simple in-memory cache
let cachedArticles: Article[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes (main feed is less time-sensitive)
const FEED_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function fetchAllFeeds(forceRefresh = false): Promise<Article[]> {
  const now = Date.now();
  if (!forceRefresh && cachedArticles.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedArticles;
  }

  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchSource(source))
  );

  const allArticles: Article[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Filter to last 7 days
  const cutoff = now - FEED_MAX_AGE;
  const fresh = allArticles.filter(
    (a) => new Date(a.publishedAt).getTime() >= cutoff
  );

  // Sort by date, newest first
  fresh.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = fresh.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  cachedArticles = deduped;
  lastFetchTime = now;

  return deduped;
}
