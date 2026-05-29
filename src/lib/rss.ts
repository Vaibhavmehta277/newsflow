import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { Article, SourceTag } from "@/types";
import { RSS_SOURCES, detectKeywords } from "./keywords";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["source", "rssSource"],
    ],
  },
});

// Only show articles from the last 7 days
const MAX_AGE_HOURS = 168;

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
  rssSource?: { _?: string; $?: { url?: string } };
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

// Google News titles often have " - Source Name" appended. Extract the real source.
function parseGoogleNewsTitle(title: string): { cleanTitle: string; realSource: string } {
  const match = title.match(/^(.+)\s-\s([^-]+)$/);
  if (match) {
    return { cleanTitle: match[1].trim(), realSource: match[2].trim() };
  }
  return { cleanTitle: title, realSource: "" };
}

function isWithinMaxAge(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  if (isNaN(articleDate.getTime())) return false;
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  return articleDate.getTime() > cutoff;
}

async function fetchSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const articles: Article[] = [];
    const isGoogleNews = source.slug.startsWith("gnews-");
    const isReddit = source.slug.startsWith("reddit-");

    for (const item of (feed.items || []).slice(0, 15)) {
      let title = item.title?.trim() || "";
      const url = item.link?.trim() || "";
      if (!title || !url) continue;

      // Parse publish date
      const publishedAt =
        item.isoDate || item.pubDate
          ? new Date(item.isoDate || item.pubDate || "").toISOString()
          : "";

      // FRESHNESS FILTER: Skip articles older than 72 hours
      if (!publishedAt || !isWithinMaxAge(publishedAt)) {
        continue;
      }

      // Handle Google News title format: "Article Title - Source Name"
      let sourceName = source.name;
      if (isGoogleNews) {
        const parsed = parseGoogleNewsTitle(title);
        title = parsed.cleanTitle;
        if (parsed.realSource) {
          sourceName = parsed.realSource;
        }
      }

      // Handle Reddit title
      if (isReddit) {
        sourceName = "Reddit";
      }

      const rawText = `${title} ${item.contentSnippet || item.summary || ""}`;
      const { keywords, category } = detectKeywords(rawText);

      // Medium-priority sources MUST match at least one keyword to avoid junk
      if (source.priority === "medium" && keywords.length === 0) {
        continue;
      }

      // Extra filter for Reddit: skip job postings, memes, personal stories
      if (isReddit) {
        const titleLower = title.toLowerCase();
        if (
          titleLower.includes("job") ||
          titleLower.includes("hiring") ||
          titleLower.includes("resume") ||
          titleLower.includes("stolen") ||
          titleLower.includes("meme")
        ) {
          continue;
        }
      }

      const summary = cleanSummary(
        item.contentSnippet || item.summary || item.content || ""
      );

      articles.push({
        id: uuidv4(),
        title,
        source: sourceName,
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
        sourceTag: source.tag,
      });
    }

    return articles;
  } catch (err) {
    console.warn(`Failed to fetch ${source.name} (${source.slug}):`, String(err).slice(0, 100));
    return [];
  }
}

let cachedArticles: Article[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min cache

export async function fetchAllFeeds(forceRefresh = false): Promise<Article[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedArticles.length > 0 &&
    now - lastFetchTime < CACHE_TTL
  ) {
    return cachedArticles;
  }

  const BATCH_SIZE = 5;
  const allArticles: Article[] = [];

  for (let i = 0; i < RSS_SOURCES.length; i += BATCH_SIZE) {
    const batch = RSS_SOURCES.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((source) => fetchSource(source))
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }
  }

  // Sort by date (newest first)
  allArticles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    // Normalize URL for dedup (strip trailing slashes, query params for Google News redirects)
    const normalizedUrl = a.url.split("?")[0].replace(/\/+$/, "");
    if (seen.has(normalizedUrl)) return false;
    // Also deduplicate by similar titles (within 80% match)
    const titleKey = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (seen.has(titleKey)) return false;
    seen.add(normalizedUrl);
    seen.add(titleKey);
    return true;
  });

  cachedArticles = deduped;
  lastFetchTime = now;

  console.log(
    `[NewsFlow] Fetched ${deduped.length} articles (${allArticles.length} before dedup) from ${RSS_SOURCES.length} sources`
  );

  return deduped;
}
