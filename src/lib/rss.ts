import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { Article } from "@/types";
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

const MAX_AGE_HOURS = 168; // 7 days

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

// Decode HTML entities (used for both titles and content)
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#32;/g, " ")
    .replace(/&#x200B;/g, ""); // zero-width space
}

// Thorough HTML + entity cleanup for summaries/content
function cleanText(text: string): string {
  // Decode entities FIRST so encoded HTML like &lt;div&gt; becomes <div> for tag stripping
  return decodeEntities(text)
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments
    .replace(/<[^>]*>/g, "") // HTML tags
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ""
    ) // strip emojis
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

// Google News titles: "Article Title - Source Name" — strip source, keep title
function parseGoogleNewsTitle(title: string): {
  cleanTitle: string;
  realSource: string;
} {
  // Match the LAST " - " followed by a short source name (greedy .+ takes everything up to last match)
  const match = title.match(/^(.+)\s-\s(.{2,50})$/);
  if (match) {
    return { cleanTitle: match[1].trim(), realSource: match[2].trim() };
  }
  return { cleanTitle: title, realSource: "" };
}

function isSummaryJustTitle(title: string, summary: string): boolean {
  if (!summary) return true;
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSummaryText = summary.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleanTitle.length < 10) return false;
  return cleanSummaryText.startsWith(
    cleanTitle.slice(0, Math.floor(cleanTitle.length * 0.7))
  );
}

function isWithinMaxAge(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  if (isNaN(articleDate.getTime())) return false;
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  return articleDate.getTime() > cutoff;
}

// Voice AI relevance check
const VOICE_AI_RELEVANCE = [
  "voice ai",
  "voice agent",
  "ai voice",
  "voice bot",
  "voicebot",
  "text to speech",
  "speech synthesis",
  "voice cloning",
  "ai receptionist",
  "ai phone",
  "call center ai",
  "contact center ai",
  "conversational ai",
  "telephony",
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

// ─── Reddit Atom XML fetcher (native fetch — rss-parser and JSON API both get 403) ──

async function fetchRedditSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/xml, application/xml, application/atom+xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Reddit returned ${res.status}`);
    const xml = await res.text();

    const articles: Article[] = [];
    const entryBlocks = xml.split("<entry>").slice(1, 20);

    for (const block of entryBlocks) {
      const title = decodeEntities(
        block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || ""
      );
      const link =
        block.match(/<link\s+href="([^"]+)"/)?.[1]?.trim() || "";
      const updated =
        block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1]?.trim() || "";
      const rawContent =
        block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]?.trim() || "";

      if (!title || !link) continue;

      // Skip subreddit entries (links to subreddits, not posts)
      if (link.match(/\/r\/[^/]+\/?$/) && !link.includes("/comments/"))
        continue;

      // Date filter
      const publishedAt = updated ? new Date(updated).toISOString() : "";
      if (!publishedAt || !isWithinMaxAge(publishedAt)) continue;

      // Junk filter
      if (isJunkArticle(title, rawContent)) continue;
      const titleLower = title.toLowerCase();
      if (
        titleLower.includes("hiring") ||
        titleLower.includes("resume") ||
        titleLower.includes("stolen") ||
        titleLower.includes("meme")
      )
        continue;

      // Clean the HTML content thoroughly
      const summary = cleanText(rawContent);
      const rawText = `${title} ${summary}`;

      // Must be voice AI relevant
      if (!isVoiceAIRelevant(rawText)) continue;

      // Extract subreddit from URL
      const subreddit = link.match(/\/r\/([^/]+)/)?.[1] || "";

      const { keywords, category } = detectKeywords(rawText);
      const signal = detectSignalType(title, summary, source.tag);

      articles.push({
        id: uuidv4(),
        title,
        source: subreddit ? `r/${subreddit}` : "Reddit",
        sourceSlug: source.slug,
        url: link,
        publishedAt,
        summary:
          summary.startsWith("submitted by") ||
          summary.startsWith("[link]") ||
          summary.length < 20
            ? ""
            : summary,
        keywords:
          keywords.length > 0
            ? keywords
            : [source.category.replace("-", " ")],
        category: keywords.length > 0 ? category : source.category,
        sourceTag: source.tag,
        signalType: signal.signalType,
        signalLabel: signal.signalLabel,
        competitorName: signal.competitorName,
        subreddit,
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

// ─── Standard RSS fetch ──────────────────────────────────────────────────

async function fetchSource(
  source: (typeof RSS_SOURCES)[0]
): Promise<Article[]> {
  try {
    // Reddit uses JSON API instead
    if (source.slug.startsWith("reddit-")) {
      return await fetchRedditSource(source);
    }

    const feed = await parser.parseURL(source.url);
    const articles: Article[] = [];
    const isGoogleNews = source.slug.startsWith("gnews-");

    for (const item of (feed.items || []).slice(0, 15)) {
      let title = decodeEntities(item.title?.trim() || "");
      const url = item.link?.trim() || "";
      if (!title || !url) continue;

      const publishedAt =
        item.isoDate || item.pubDate
          ? new Date(item.isoDate || item.pubDate || "").toISOString()
          : "";

      if (!publishedAt || !isWithinMaxAge(publishedAt)) continue;

      let sourceName = source.name;
      if (isGoogleNews) {
        const parsed = parseGoogleNewsTitle(title);
        title = parsed.cleanTitle;
        if (parsed.realSource) {
          sourceName = parsed.realSource;
        }
      }

      const rawSummary =
        item.contentSnippet || item.summary || item.content || "";
      const rawText = `${title} ${rawSummary}`;

      if (isJunkArticle(title, rawText)) continue;

      const { keywords, category } = detectKeywords(rawText);

      if (source.priority === "medium" && keywords.length === 0) continue;

      let summary = cleanText(rawSummary);
      if (isSummaryJustTitle(title, summary)) {
        summary = "";
      }

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

// ─── Smart dedup: catch "same story, different source" ──────────────────

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "has",
  "have",
  "had",
  "it",
  "its",
  "this",
  "that",
  "as",
  "how",
  "new",
  "s",
]);

function getSignificantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/'s\b/g, "") // strip possessives before normalization
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function isSameStory(title1: string, title2: string): boolean {
  const words1 = getSignificantWords(title1);
  const words2 = getSignificantWords(title2);
  if (words1.size < 3 || words2.size < 3) return false;

  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  const minSize = Math.min(words1.size, words2.size);
  return overlap / minSize >= 0.6; // 60% word overlap = same story
}

// ─── Main fetch ──────────────────────────────────────────────────────────

let cachedArticles: Article[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

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

  // Smart dedup: URL + title similarity
  const kept: Article[] = [];
  const seenUrls = new Set<string>();

  for (const article of allArticles) {
    const normalizedUrl = article.url.split("?")[0].replace(/\/+$/, "");
    if (seenUrls.has(normalizedUrl)) continue;

    // Check if this is the same story as any already-kept article
    const isDuplicate = kept.some((k) => isSameStory(k.title, article.title));
    if (isDuplicate) continue;

    seenUrls.add(normalizedUrl);
    kept.push(article);
  }

  cachedArticles = kept;
  lastFetchTime = now;

  const tagBreakdown = kept.reduce(
    (acc, a) => {
      acc[a.sourceTag || "unknown"] = (acc[a.sourceTag || "unknown"] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(
    `[NewsFlow] ${kept.length} articles (${allArticles.length} before dedup) from ${RSS_SOURCES.length} sources | ${JSON.stringify(tagBreakdown)}`
  );

  return kept;
}
