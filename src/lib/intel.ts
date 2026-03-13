import OpenAI from "openai";
import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import { fetchAllFeeds } from "./rss";
import type { IntelItem } from "@/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── Freshness cutoff ────────────────────────────────────────────────────────
const FRESHNESS_48H = 48 * 60 * 60 * 1000;

// ── Competitor list ────────────────────────────────────────────────────────
export const COMPETITORS = [
  "Vapi", "Retell AI", "Bland AI", "Synthflow", "ElevenLabs", "PlayHT",
  "Deepgram", "AssemblyAI", "Speechify", "Lovo AI", "Murf AI",
  "WellSaid Labs", "Resemble AI", "Cartesia AI", "Hume AI", "Speechmatics",
  "Otter.ai", "Twilio", "Five9", "Genesys", "NICE CXone", "Talkdesk",
  "Avaya", "Amazon Connect", "Google CCAI", "Nuance Communications",
  "Cognigy", "Kore.ai", "Yellow.ai", "Rasa", "LivePerson", "Gong",
  "Dialpad", "RingCentral", "Vonage", "Observe.AI", "Cresta",
];

const ALIASES: Record<string, string> = {
  "retell": "Retell AI", "bland": "Bland AI", "eleven labs": "ElevenLabs",
  "play.ht": "PlayHT", "assembly ai": "AssemblyAI", "lovo": "Lovo AI",
  "murf": "Murf AI", "wellsaid": "WellSaid Labs", "resemble": "Resemble AI",
  "cartesia": "Cartesia AI", "hume ai": "Hume AI", "hume": "Hume AI",
  "nice cxone": "NICE CXone", "amazon connect": "Amazon Connect",
  "google ccai": "Google CCAI", "google contact center ai": "Google CCAI",
  "nuance": "Nuance Communications", "kore ai": "Kore.ai",
  "yellow ai": "Yellow.ai", "live person": "LivePerson",
  "ring central": "RingCentral", "observe ai": "Observe.AI",
};

// ── Reddit search feeds (competitor-focused) ───────────────────────────────
const INTEL_REDDIT_FEEDS = [
  "https://www.reddit.com/search.rss?q=vapi+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=retell+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=bland+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=elevenlabs+voice+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=twilio+voice+alternative&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=voice+ai+alternative&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=conversational+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+call+center&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+receptionist&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=virtual+receptionist&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=phone+automation&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+phone+calls&sort=new&limit=25",
  // Subreddits
  "https://www.reddit.com/r/artificial/new.rss?limit=25",
  "https://www.reddit.com/r/MachineLearning/new.rss?limit=25",
  "https://www.reddit.com/r/SaaS/new.rss?limit=25",
  "https://www.reddit.com/r/startups/new.rss?limit=25",
  "https://www.reddit.com/r/callcenters/new.rss?limit=25",
  "https://www.reddit.com/r/voip/new.rss?limit=25",
];

// ── HN Algolia queries ─────────────────────────────────────────────────────
const INTEL_HN_QUERIES = [
  "voice ai", "vapi", "retell ai", "conversational ai",
  "call center ai", "ai receptionist", "bland ai",
];

// ── GitHub queries ─────────────────────────────────────────────────────────
const INTEL_GITHUB_QUERIES = [
  "voice+ai", "conversational+ai", "ai+phone+agent",
];

// ── Product Hunt voice AI keywords ────────────────────────────────────────
const PH_KEYWORDS = ["voice", "call", "receptionist", "phone", "speech", "conversation", "ivr", "contact center"];

// ── Demo data (shown when no real signals found) ───────────────────────────
export const DEMO_INTEL_ITEMS: IntelItem[] = [
  {
    id: "demo-intel-1", competitor: "Vapi", mentionedCompetitors: ["Vapi"],
    title: "Anyone else experiencing high latency with Vapi? Getting 3-4 second delays",
    summary: "We've been using Vapi for our real estate business and the latency has been getting worse. 3-4 second delays before the AI responds are killing our conversion rates. Has anyone switched to something better?",
    url: "https://reddit.com/r/artificial", source: "Reddit",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "User experiencing latency issues with Vapi hurting conversions — Smallest AI's sub-second response times are a direct solution.",
    score: 9, tier: "hot", platform: "reddit",
  },
  {
    id: "demo-intel-2", competitor: "Bland AI", mentionedCompetitors: ["Bland AI"],
    title: "Bland AI pricing just doubled — looking for alternatives",
    summary: "Got an email from Bland AI that they're increasing prices by 2x next month. We're processing about 10k calls/month. What are people moving to?",
    url: "https://reddit.com/r/SaaS", source: "Reddit",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "Actively seeking alternatives after Bland AI price doubling — strong acquisition opportunity with urgency.",
    score: 10, tier: "hot", platform: "reddit",
  },
  {
    id: "demo-intel-3", competitor: "Retell AI", mentionedCompetitors: ["Retell AI"],
    title: "Retell AI vs alternatives for dental office — which handles interruptions best?",
    summary: "Running a dental practice. Currently evaluating Retell AI but our patients frequently interrupt the bot mid-sentence and it gets confused.",
    url: "https://reddit.com/r/entrepreneur", source: "Reddit",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "Healthcare buyer comparing voice AI with specific interruption-handling pain point — direct differentiator for Smallest AI.",
    score: 8, tier: "hot", platform: "reddit",
  },
  {
    id: "demo-intel-4", competitor: "ElevenLabs", mentionedCompetitors: ["ElevenLabs"],
    title: "ElevenLabs voices sound great but the API is frustrating to work with",
    summary: "Love the voice quality from ElevenLabs but building a production system around their API has been painful. Rate limits hit at the worst times.",
    url: "https://news.ycombinator.com/item?id=1", source: "Hacker News",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "Developer frustrated with ElevenLabs API reliability — Smallest AI's developer-friendly API + responsive support is a strong counter.",
    score: 6, tier: "warm", platform: "hn",
  },
  {
    id: "demo-intel-5", competitor: "Twilio", mentionedCompetitors: ["Twilio"],
    title: "Switching from Twilio to something AI-native — any recommendations?",
    summary: "We built our call center on Twilio but it's showing its age. Looking for a more AI-native solution. Budget is flexible.",
    url: "https://news.ycombinator.com/item?id=2", source: "Hacker News",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "Active Twilio migration with flexible budget — ideal candidate for Smallest AI's full-stack voice AI platform.",
    score: 7, tier: "warm", platform: "hn",
  },
  {
    id: "demo-intel-6", competitor: "Deepgram", mentionedCompetitors: ["Deepgram"],
    title: "Deepgram STT accuracy on phone calls — real-world numbers?",
    summary: "Evaluating STT providers for a call center project. Has anyone run Deepgram on real phone audio? Curious about word error rates in noisy environments.",
    url: "https://reddit.com/r/callcenters", source: "Reddit",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    opportunityNote: "Technical buyer evaluating STT accuracy for phone calls — in active consideration phase. Phone-optimized models could be highlighted.",
    score: 4, tier: "watching", platform: "reddit",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function detectCompetitors(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const comp of COMPETITORS) {
    if (lower.includes(comp.toLowerCase())) found.add(comp);
  }
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) found.add(canonical);
  }
  return Array.from(found);
}

function cleanText(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 400);
}

// ── RSS parser ─────────────────────────────────────────────────────────────
const rssParser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NewsFlowBot/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

interface ContentItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  platform: "reddit" | "rss" | "hn" | "github" | "producthunt";
}

// ── Reddit fetching ────────────────────────────────────────────────────────
async function fetchRedditItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  const cutoff = Date.now() - FRESHNESS_48H;
  let successCount = 0, failCount = 0;

  await Promise.allSettled(
    INTEL_REDDIT_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await rssParser.parseURL(feedUrl);
        const items = feed.items || [];
        console.log(`[Intel] Reddit feed OK: ${feedUrl.slice(30, 80)} → ${items.length} items`);
        successCount++;

        for (const item of items.slice(0, 15)) {
          const title = item.title?.trim() || "";
          const url = item.link?.trim() || "";
          if (!title || !url) continue;

          const publishedAt = item.isoDate || item.pubDate
            ? new Date(item.isoDate || item.pubDate || "").toISOString()
            : new Date().toISOString();

          if (new Date(publishedAt).getTime() < cutoff) continue;

          results.push({
            title,
            summary: cleanText(item.contentSnippet || item.content || item.summary || ""),
            url,
            source: "Reddit",
            publishedAt,
            platform: "reddit",
          });
        }
      } catch (err) {
        failCount++;
        console.warn(`[Intel] Reddit FAILED: ${feedUrl.slice(30, 70)}`, err instanceof Error ? err.message : String(err));
      }
    })
  );

  console.log(`[Intel] Reddit: ${successCount} ok, ${failCount} failed, ${results.length} fresh items`);
  return results;
}

// ── Hacker News Algolia API ────────────────────────────────────────────────
async function fetchHNItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  const cutoff = Date.now() - FRESHNESS_48H;

  await Promise.allSettled(
    INTEL_HN_QUERIES.map(async (query) => {
      try {
        const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { hits: Array<{ objectID: string; title?: string; url?: string; points?: number; created_at: string; story_text?: string }> };
        let added = 0;

        for (const hit of (data.hits || [])) {
          if (!hit.title || !hit.url) continue;
          const t = new Date(hit.created_at).getTime();
          if (t < cutoff || (hit.points ?? 0) < 10) continue;

          results.push({
            title: hit.title,
            summary: cleanText(hit.story_text || ""),
            url: hit.url,
            source: "Hacker News",
            publishedAt: hit.created_at,
            platform: "hn",
          });
          added++;
        }
        console.log(`[Intel] HN "${query}": ${added} fresh items (≥10pts)`);
      } catch (err) {
        console.warn(`[Intel] HN query "${query}" failed:`, err instanceof Error ? err.message : String(err));
      }
    })
  );

  return results;
}

// ── GitHub trending repos ──────────────────────────────────────────────────
async function fetchGitHubItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  const cutoffDate = new Date(Date.now() - FRESHNESS_48H).toISOString().split("T")[0];

  await Promise.allSettled(
    INTEL_GITHUB_QUERIES.map(async (query) => {
      try {
        const url = `https://api.github.com/search/repositories?q=${query}+pushed:>${cutoffDate}&sort=updated&order=desc&per_page=5`;
        const res = await fetch(url, {
          headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "NewsFlowBot/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { items?: Array<{ full_name: string; html_url: string; description?: string; stargazers_count: number; updated_at: string; pushed_at: string }> };
        let added = 0;

        for (const repo of (data.items || [])) {
          if (repo.stargazers_count < 10) continue;
          results.push({
            title: `[GitHub] ${repo.full_name}: ${repo.description || "Updated repository"}`,
            summary: `${repo.description || repo.full_name} — ${repo.stargazers_count} stars, updated recently`,
            url: repo.html_url,
            source: "GitHub",
            publishedAt: repo.pushed_at || repo.updated_at,
            platform: "github",
          });
          added++;
        }
        console.log(`[Intel] GitHub "${query}": ${added} repos`);
      } catch (err) {
        console.warn(`[Intel] GitHub "${query}" failed:`, err instanceof Error ? err.message : String(err));
      }
    })
  );

  return results;
}

// ── Product Hunt RSS ───────────────────────────────────────────────────────
async function fetchProductHuntItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  const cutoff = Date.now() - FRESHNESS_48H;

  try {
    const feed = await rssParser.parseURL("https://www.producthunt.com/feed");
    for (const item of (feed.items || []).slice(0, 25)) {
      const title = item.title?.trim() || "";
      const url = item.link?.trim() || "";
      if (!title || !url) continue;

      const publishedAt = item.isoDate || item.pubDate
        ? new Date(item.isoDate || item.pubDate || "").toISOString()
        : new Date().toISOString();

      if (new Date(publishedAt).getTime() < cutoff) continue;

      const text = `${title} ${item.contentSnippet || ""}`.toLowerCase();
      if (!PH_KEYWORDS.some((kw) => text.includes(kw))) continue;

      results.push({
        title,
        summary: cleanText(item.contentSnippet || item.summary || ""),
        url,
        source: "Product Hunt",
        publishedAt,
        platform: "producthunt",
      });
    }
    console.log(`[Intel] Product Hunt: ${results.length} relevant items`);
  } catch (err) {
    console.warn("[Intel] Product Hunt failed:", err instanceof Error ? err.message : String(err));
  }

  return results;
}

// ── Batch OpenAI analysis ──────────────────────────────────────────────────

interface BatchAnalysisResult {
  index: number;
  opportunityNote: string;
  score: number;
}

async function batchAnalyze(
  items: { title: string; summary: string; competitors: string[] }[]
): Promise<BatchAnalysisResult[]> {
  if (items.length === 0) return [];

  const itemsText = items
    .map((item, i) =>
      `[${i + 1}] Competitors mentioned: ${item.competitors.join(", ")}\nTitle: ${item.title}\nContext: ${item.summary}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are a competitive intelligence analyst for Smallest AI, a Voice AI platform for businesses.

Score competitor mentions by sales opportunity potential:
- 8-10 (Hot): Active frustration, switching intent, seeking alternatives, direct complaints
- 5-7 (Warm): Price complaints, feature gaps, comparison requests, mild dissatisfaction
- 1-4 (Watching): Neutral mentions, product launches, general discussions

ALL competitor mentions are valuable — even neutral ones get a score.`;

  const userPrompt = `Analyze these ${items.length} posts mentioning voice AI competitors. Score EVERY item.

${itemsText}

Return JSON array for ALL ${items.length} items:
[{ "index": 1, "opportunityNote": "1-2 sentence sales opportunity note", "score": 8 }]`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content ?? "";
    console.log(`[Intel] OpenAI response preview: ${responseText.slice(0, 150)}`);
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) { console.warn("[Intel] OpenAI returned no JSON"); return []; }

    const parsed = JSON.parse(jsonMatch[0]) as BatchAnalysisResult[];
    console.log(`[Intel] OpenAI scored ${parsed.length} items`);
    return parsed;
  } catch (err) {
    console.error("[Intel] OpenAI error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

// ── In-memory cache ────────────────────────────────────────────────────────
let cachedItems: IntelItem[] = [];
let cachedIsDemo = false;
let lastFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchIntelItems(forceRefresh = false): Promise<{ items: IntelItem[]; isDemo: boolean }> {
  const now = Date.now();
  if (!forceRefresh && lastFetch > 0 && now - lastFetch < CACHE_TTL) {
    console.log(`[Intel] Returning cache (${cachedItems.length} items, isDemo=${cachedIsDemo})`);
    return { items: cachedItems, isDemo: cachedIsDemo };
  }

  console.log("[Intel] Starting fresh fetch…");

  // 1. Gather from all sources in parallel
  const [rssArticles, redditItems, hnItems, githubItems, phItems] = await Promise.all([
    fetchAllFeeds(),
    fetchRedditItems(),
    fetchHNItems(),
    fetchGitHubItems(),
    fetchProductHuntItems(),
  ]);

  const rssContent: ContentItem[] = rssArticles
    .filter((a) => Date.now() - new Date(a.publishedAt).getTime() < FRESHNESS_48H)
    .map((a) => ({
      title: a.title, summary: a.summary, url: a.url,
      source: a.source, publishedAt: a.publishedAt, platform: "rss" as const,
    }));

  const allContent: ContentItem[] = [...rssContent, ...redditItems, ...hnItems, ...githubItems, ...phItems];
  console.log(`[Intel] Total fresh content: ${allContent.length} (RSS:${rssContent.length} Reddit:${redditItems.length} HN:${hnItems.length} GitHub:${githubItems.length} PH:${phItems.length})`);

  // 2. Pre-filter: must mention at least one competitor
  const candidates = allContent.filter((item) => {
    return detectCompetitors(`${item.title} ${item.summary}`).length > 0;
  });
  console.log(`[Intel] Competitor mentions: ${candidates.length} / ${allContent.length}`);

  if (candidates.length === 0) {
    console.log("[Intel] No competitor mentions found — returning demo data");
    cachedItems = []; cachedIsDemo = true; lastFetch = now;
    return { items: DEMO_INTEL_ITEMS, isDemo: true };
  }

  // 3. Deduplicate by URL, newest 40
  const seenUrls = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seenUrls.has(c.url)) return false;
    seenUrls.add(c.url); return true;
  });
  // Sort by recency before capping
  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const limited = unique.slice(0, 40);

  console.log(`[Intel] After dedup + cap: ${limited.length} candidates`);

  // 4. Batch OpenAI (10 per batch)
  const BATCH_SIZE = 10;
  const intelItems: IntelItem[] = [];

  for (let i = 0; i < limited.length; i += BATCH_SIZE) {
    const batch = limited.slice(i, i + BATCH_SIZE);
    console.log(`[Intel] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} items`);

    const batchInput = batch.map((item) => ({
      title: item.title,
      summary: item.summary.slice(0, 300),
      competitors: detectCompetitors(`${item.title} ${item.summary}`),
    }));

    const results = await batchAnalyze(batchInput);

    for (const result of results) {
      const item = batch[result.index - 1];
      if (!item || result.score < 1) continue;

      const competitors = detectCompetitors(`${item.title} ${item.summary}`);
      const score = Math.min(10, Math.max(1, Math.round(result.score)));
      const tier: IntelItem["tier"] = score >= 8 ? "hot" : score >= 5 ? "warm" : "watching";

      intelItems.push({
        id: uuidv4(),
        competitor: competitors[0] || "Unknown",
        mentionedCompetitors: competitors,
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        opportunityNote: result.opportunityNote,
        score,
        tier,
        platform: item.platform,
      });
    }
  }

  // 5. Sort by recency within each tier, then overall by score
  intelItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  console.log(`[Intel] Final: ${intelItems.length} items (${intelItems.filter(i => i.tier === "hot").length} hot, ${intelItems.filter(i => i.tier === "warm").length} warm, ${intelItems.filter(i => i.tier === "watching").length} watching)`);

  if (intelItems.length === 0) {
    console.log("[Intel] No results from OpenAI — returning demo data");
    cachedItems = []; cachedIsDemo = true; lastFetch = now;
    return { items: DEMO_INTEL_ITEMS, isDemo: true };
  }

  cachedItems = intelItems;
  cachedIsDemo = false;
  lastFetch = now;

  return { items: intelItems, isDemo: false };
}
