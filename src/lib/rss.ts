import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { Article, SourceTag } from "@/types";
import {
  RSS_SOURCES,
  detectKeywords,
  detectSignalType,
  detectCompetitorFromSlug,
  isJunkArticle,
} from "./keywords";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": UA,
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
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

// Reddit blocks rss-parser but accepts native fetch. Parse Atom XML manually.
interface RedditEntry {
  title: string;
  link: string;
  published: string;
  content: string;
}

async function fetchRedditRSS(url: string): Promise<RedditEntry[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/xml, application/xml, application/atom+xml, */*",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Reddit returned ${res.status}`);
  const xml = await res.text();

  const entries: RedditEntry[] = [];
  const entryBlocks = xml.split("<entry>");
  for (let i = 1; i < entryBlocks.length && i <= 15; i++) {
    const block = entryBlocks[i];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const link =
      block.match(/<link\s+href="([^"]+)"/)?.[1]?.trim() || "";
    const published =
      block.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim() ||
      block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() ||
      "";
    const content =
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.trim() || "";
    if (title && link) {
      entries.push({ title, link, published, content });
    }
  }
  return entries;
}

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
function parseGoogleNewsTitle(title: string): {
  cleanTitle: string;
  realSource: string;
} {
  const match = title.match(/^(.+)\s-\s([^-]+)$/);
  if (match) {
    return { cleanTitle: match[1].trim(), realSource: match[2].trim() };
  }
  return { cleanTitle: title, realSource: "" };
}

// Check if the summary is just the title repeated (common Google News issue)
function isSummaryJustTitle(title: string, summary: string): boolean {
  if (!summary) return true;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSummaryText = summary.toLowerCase().replace(/[^a-z0-9]/g, "");
  // If the summary starts with 80% of the title, it's likely just a repeat
  return (
    cleanSummaryText.startsWith(cleanTitle.slice(0, cleanTitle.length * 0.8))
  );
}

function isWithinMaxAge(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  if (isNaN(articleDate.getTime())) return false;
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  return articleDate.getTime() > cutoff;
}

// Voice AI relevance check — at least one of these must appear for non-high-priority sources
const VOICE_AI_RELEVANCE = [
  "voice ai",
  "voice agent",
  "ai voice",
  "voice bot",
  "voicebot",
  "text to speech",
  "tts ",
  "speech synthesis",
  "voice cloning",
  "ai receptionist",
  "ai phone",
  "call center ai",
  "contact center ai",
  "conversational ai",
  "telephony",
  "ivr",
  "vapi",
  "retell ai",
  "elevenlabs",
  "eleven labs",
  "bland ai",
  "synthflow",
  "voice api",
  "voice platform",
];

function isVoiceAIRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return VOICE_AI_RELEVANCE.some((term) => lower.includes(term));
}

async function fetchSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    const isGoogleNews = source.slug.startsWith("gnews-");
    const isReddit = source.slug.startsWith("reddit-");

    // Use native fetch for Reddit (rss-parser gets 403'd)
    if (isReddit) {
      return await fetchRedditSource(source);
    }

    const feed = await parser.parseURL(source.url);
    const articles: Article[] = [];

    for (const item of (feed.items || []).slice(0, 15)) {
      let title = item.title?.trim() || "";
      const url = item.link?.trim() || "";
      if (!title || !url) continue;

      // Parse publish date
      const publishedAt =
        item.isoDate || item.pubDate
          ? new Date(item.isoDate || item.pubDate || "").toISOString()
          : "";

      // FRESHNESS FILTER: Skip articles older than 7 days
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

      // JUNK FILTER: Skip irrelevant articles
      const rawText = `${title} ${item.contentSnippet || item.summary || ""}`;
      if (isJunkArticle(title, rawText)) {
        continue;
      }

      const { keywords, category } = detectKeywords(rawText);

      // Medium-priority sources MUST match at least one keyword to avoid junk
      if (source.priority === "medium" && keywords.length === 0) {
        continue;
      }

      let summary = cleanSummary(
        item.contentSnippet || item.summary || item.content || ""
      );

      // If summary is just repeating the title, clear it
      if (isSummaryJustTitle(title, summary)) {
        summary = "";
      }

      // Detect signal type and competitor
      const competitorFromSlug = detectCompetitorFromSlug(source.slug);
      const signal = detectSignalType(title, summary, source.tag);

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
        signalType: signal.signalType,
        signalLabel: signal.signalLabel,
        competitorName: competitorFromSlug || signal.competitorName,
      });
    }

    return articles;
  } catch (err) {
    console.warn(
      `Failed to fetch ${source.name} (${source.slug}):`,
      String(err).slice(0, 100)
    );
    return [];
  }
}

// Separate Reddit fetcher using native fetch (rss-parser gets blocked)
async function fetchRedditSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    const entries = await fetchRedditRSS(source.url);
    const articles: Article[] = [];

    for (const entry of entries) {
      const title = entry.title?.trim() || "";
      const url = entry.link?.trim() || "";
      if (!title || !url) continue;

      // Parse date
      const publishedAt = entry.published
        ? new Date(entry.published).toISOString()
        : "";
      if (!publishedAt || !isWithinMaxAge(publishedAt)) continue;

      // Junk filter
      if (isJunkArticle(title, entry.content || "")) continue;

      const titleLower = title.toLowerCase();
      if (
        titleLower.includes("job") ||
        titleLower.includes("hiring") ||
        titleLower.includes("resume") ||
        titleLower.includes("stolen") ||
        titleLower.includes("meme") ||
        titleLower.includes("psychiatrist") ||
        titleLower.includes("therapist") ||
        titleLower.includes("horoscope")
      )
        continue;

      // Clean Reddit HTML content for summary
      const rawContent = cleanSummary(entry.content || "");
      const rawText = `${title} ${rawContent}`;

      // Must be voice AI relevant
      if (!isVoiceAIRelevant(rawText)) continue;

      let summary = rawContent;
      if (summary.startsWith("submitted by") || summary.startsWith("&#32;")) {
        summary = "";
      }
      if (isSummaryJustTitle(title, summary)) {
        summary = "";
      }

      const { keywords, category } = detectKeywords(rawText);
      const signal = detectSignalType(title, summary, source.tag);

      articles.push({
        id: uuidv4(),
        title,
        source: "Reddit",
        sourceSlug: source.slug,
        url,
        publishedAt,
        summary,
        keywords:
          keywords.length > 0
            ? keywords
            : [source.category.replace("-", " ")],
        category: keywords.length > 0 ? category : source.category,
        sourceTag: source.tag,
        signalType: signal.signalType,
        signalLabel: signal.signalLabel,
        competitorName: signal.competitorName,
      });
    }

    return articles;
  } catch (err) {
    console.warn(
      `Failed to fetch ${source.name} (${source.slug}):`,
      String(err).slice(0, 100)
    );
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

  // Deduplicate by URL and similar titles
  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    // Normalize URL for dedup (strip trailing slashes, query params for Google News redirects)
    const normalizedUrl = a.url.split("?")[0].replace(/\/+$/, "");
    if (seen.has(normalizedUrl)) return false;

    // Deduplicate by similar titles (normalized to lowercase alphanumeric first 40 chars)
    const titleKey = a.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 40);
    if (seen.has(titleKey)) return false;

    seen.add(normalizedUrl);
    seen.add(titleKey);
    return true;
  });

  cachedArticles = deduped;
  lastFetchTime = now;

  const tagBreakdown = deduped.reduce(
    (acc, a) => {
      const tag = a.sourceTag || "unknown";
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const signalBreakdown = deduped.reduce(
    (acc, a) => {
      const signal = a.signalType || "unknown";
      acc[signal] = (acc[signal] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(
    `[NewsFlow] Fetched ${deduped.length} articles (${allArticles.length} before dedup) from ${RSS_SOURCES.length} sources`
  );
  console.log(`[NewsFlow] By tag:`, tagBreakdown);
  console.log(`[NewsFlow] By signal:`, signalBreakdown);

  return deduped;
}
