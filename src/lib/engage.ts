import OpenAI from "openai";
import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { EngageItem, EngageTopicTag } from "@/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const FRESHNESS_WINDOW = 7 * 24 * 60 * 60 * 1000;

// ── Engagement keywords — threads worth jumping into ─────────────────────────

const ENGAGE_KEYWORDS: { keyword: string; tag: EngageTopicTag }[] = [
  // Voice AI discussion
  { keyword: "voice ai", tag: "voice-ai-discussion" },
  { keyword: "voice agent", tag: "voice-ai-discussion" },
  { keyword: "ai calling", tag: "voice-ai-discussion" },
  { keyword: "conversational ai", tag: "voice-ai-discussion" },
  { keyword: "ai phone", tag: "voice-ai-discussion" },
  { keyword: "speech ai", tag: "voice-ai-discussion" },
  { keyword: "ai voice", tag: "voice-ai-discussion" },
  { keyword: "voice bot", tag: "voice-ai-discussion" },
  { keyword: "llm voice", tag: "voice-ai-discussion" },
  { keyword: "real-time voice", tag: "voice-ai-discussion" },
  // Competitor mentions
  { keyword: "vapi", tag: "competitor-mention" },
  { keyword: "retell ai", tag: "competitor-mention" },
  { keyword: "bland ai", tag: "competitor-mention" },
  { keyword: "elevenlabs", tag: "competitor-mention" },
  { keyword: "synthflow", tag: "competitor-mention" },
  { keyword: "twilio voice", tag: "competitor-mention" },
  { keyword: "deepgram", tag: "competitor-mention" },
  { keyword: "play.ai", tag: "competitor-mention" },
  // Pain point threads
  { keyword: "missed calls", tag: "pain-point-thread" },
  { keyword: "phone system", tag: "pain-point-thread" },
  { keyword: "receptionist", tag: "pain-point-thread" },
  { keyword: "after-hours", tag: "pain-point-thread" },
  { keyword: "call volume", tag: "pain-point-thread" },
  { keyword: "front desk", tag: "pain-point-thread" },
  { keyword: "appointment no-show", tag: "pain-point-thread" },
  { keyword: "voicemail", tag: "pain-point-thread" },
  // Solution requests
  { keyword: "looking for voice", tag: "solution-request" },
  { keyword: "recommend voice ai", tag: "solution-request" },
  { keyword: "ai receptionist", tag: "solution-request" },
  { keyword: "automate calls", tag: "solution-request" },
  { keyword: "virtual receptionist", tag: "solution-request" },
  { keyword: "call automation", tag: "solution-request" },
  // Industry news
  { keyword: "voice ai funding", tag: "industry-news" },
  { keyword: "voice ai startup", tag: "industry-news" },
  { keyword: "ai call center", tag: "industry-news" },
  { keyword: "voice technology", tag: "industry-news" },
];

function detectTopicTag(text: string): EngageTopicTag | null {
  const lower = text.toLowerCase();
  const tagCounts = new Map<EngageTopicTag, number>();
  for (const { keyword, tag } of ENGAGE_KEYWORDS) {
    if (lower.includes(keyword)) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  if (tagCounts.size === 0) return null;
  let top: EngageTopicTag = "voice-ai-discussion";
  let topCount = 0;
  for (const [tag, count] of tagCounts.entries()) {
    if (count > topCount) {
      topCount = count;
      top = tag;
    }
  }
  return top;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

export const DEMO_ENGAGE_ITEMS: EngageItem[] = [
  {
    id: "demo-engage-1",
    title: "What's the best voice AI stack for a real-time outbound calling agent in 2025?",
    snippet:
      "Building an outbound calling agent for a real estate client. Currently evaluating Vapi, Retell, and a few others. Main concerns are latency (<500ms), naturalness, and cost per minute at scale.",
    url: "https://reddit.com/r/SaaS",
    source: "Reddit · r/SaaS",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    platform: "reddit",
    topicTag: "competitor-mention",
    engagementAngle:
      "This is a direct competitor comparison thread — add genuine value by sharing latency benchmarks and pointing out Smallest AI's real-time TTS/STT pipeline advantage without being salesy.",
    replyDraft:
      "We benchmarked a few of these extensively for a similar use case. Latency at scale was the biggest differentiator — most platforms hit 600-900ms with their default models. Smallest AI runs a custom real-time pipeline that consistently stays under 400ms even on outbound. Happy to share our architecture notes if useful.",
    score: 9,
    tier: "hot",
    isConversational: true,
    commentCount: 34,
  },
  {
    id: "demo-engage-2",
    title: "Anyone successfully deployed voice AI for dental appointment reminders?",
    snippet:
      "Dental practice owner here. We have 400+ patients and want to automate reminder calls and confirmations. Tried a basic IVR but patients hate it. Looking for something that sounds human.",
    url: "https://reddit.com/r/Dentistry",
    source: "Reddit · r/Dentistry",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    platform: "reddit",
    topicTag: "solution-request",
    engagementAngle:
      "Healthcare IVR frustration is a great entry point. Share a concrete example of how natural-sounding voice AI changes patient acceptance rates — this is a pain point + solution request.",
    replyDraft:
      "We've seen this exact issue — patients hang up on robotic IVR reminders at a much higher rate than human-sounding calls. The key is a voice model trained on actual clinical language and proper pause handling. Some practices we work with have seen no-show rates drop 20-30% after switching to AI reminders that actually sound conversational.",
    score: 8,
    tier: "hot",
    isConversational: true,
    commentCount: 18,
  },
  {
    id: "demo-engage-3",
    title: "Show HN: I built a latency benchmark for the top voice AI APIs",
    snippet:
      "Tested Vapi, Retell, Bland, Deepgram + ElevenLabs combo, and a few others on first-word latency, mid-conversation latency, and recovery time after interruption. Results were surprising.",
    url: "https://news.ycombinator.com/item?id=40291847",
    source: "Hacker News",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    platform: "hn",
    topicTag: "voice-ai-discussion",
    engagementAngle:
      "High-signal HN post directly comparing voice AI APIs. Add technical credibility by engaging with the benchmark methodology and sharing where Smallest AI fits in the latency landscape.",
    replyDraft:
      "Great methodology — interruption recovery latency is the metric most benchmarks skip, and it's often what determines whether a call feels natural. One thing worth adding to the benchmark: latency under concurrent load (50+ simultaneous calls). That's where most pipelines degrade significantly. Happy to share our numbers from production.",
    score: 9,
    tier: "hot",
    isConversational: true,
    commentCount: 142,
  },
  {
    id: "demo-engage-4",
    title: "Voice AI for insurance agency — is the ROI actually there?",
    snippet:
      "Running a mid-size insurance agency. Leadership wants to pilot voice AI for renewal calls and lead follow-up. I'm skeptical about conversion rates vs human agents. Has anyone measured this?",
    url: "https://reddit.com/r/Insurance",
    source: "Reddit · r/Insurance",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    platform: "reddit",
    topicTag: "pain-point-thread",
    engagementAngle:
      "ROI skepticism is a genuine opportunity — share concrete conversion data from insurance use cases to move the conversation forward with evidence, not promises.",
    replyDraft:
      "Measured this carefully with an insurance client — for renewal calls specifically, AI handled 78% of calls to completion with conversion rates within 5% of human agents (at roughly 1/10th the cost). The gap closed with better script iteration over 3-4 weeks. Lead follow-up at <5 min speed-to-call is where AI consistently beats human agents on connect rate.",
    score: 7,
    tier: "warm",
    isConversational: true,
    commentCount: 27,
  },
  {
    id: "demo-engage-5",
    title: "ElevenLabs vs Deepgram for real-time voice synthesis — latency comparison",
    snippet:
      "Building a voice assistant and trying to decide between ElevenLabs Turbo v2 and Deepgram Aura for the TTS layer. Latency is my top concern for a conversational use case.",
    url: "https://reddit.com/r/MachineLearning",
    source: "Reddit · r/MachineLearning",
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    platform: "reddit",
    topicTag: "competitor-mention",
    engagementAngle:
      "Pure technical discussion — add value with real-world latency data from production deployments without being promotional. Mention custom TTS options as a consideration.",
    replyDraft:
      "Both are solid but have different tradeoffs. ElevenLabs Turbo v2 has better voice quality but slightly higher TTFB in our testing (~280ms vs ~220ms for Deepgram Aura). For purely conversational use cases where naturalness matters more, ElevenLabs tends to win on perceived quality. One underrated option is building a custom TTS pipeline tuned specifically for your voice profile — latency gets significantly better with a purpose-built model.",
    score: 6,
    tier: "warm",
    isConversational: true,
    commentCount: 53,
  },
  {
    id: "demo-engage-6",
    title: "AI call center market is getting crowded — who are the real players?",
    snippet:
      "Working on a market analysis for AI-powered call centers. The space has exploded — Vapi, Retell, Bland, Cognigy, LivePerson, and many more. Hard to track who's actually winning.",
    url: "https://news.ycombinator.com/item?id=40288123",
    source: "Hacker News",
    publishedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    platform: "hn",
    topicTag: "industry-news",
    engagementAngle:
      "Market analysis thread — great place to share a nuanced view of the landscape segmentation (infra vs platform vs vertical) to establish category expertise.",
    replyDraft:
      "Worth segmenting the market into three layers: infra (Deepgram, ElevenLabs — pure speech APIs), orchestration (Vapi, Retell, Bland — voice agent platforms), and vertical (companies building on top for specific industries). The orchestration layer is most competitive right now and likely to consolidate around 2-3 players by end of 2025. Latency, reliability, and pricing are the key battlegrounds at that layer.",
    score: 5,
    tier: "watching",
    isConversational: true,
    commentCount: 89,
  },
];

// ── RSS sources for engagement monitoring ─────────────────────────────────────

const ENGAGE_REDDIT_FEEDS = [
  "https://www.reddit.com/r/SaaS/new.rss?limit=25",
  "https://www.reddit.com/r/MachineLearning/new.rss?limit=25",
  "https://www.reddit.com/r/artificial/new.rss?limit=25",
  "https://www.reddit.com/r/Entrepreneur/new.rss?limit=25",
  "https://www.reddit.com/r/startups/new.rss?limit=25",
  "https://www.reddit.com/r/callcenters/new.rss?limit=25",
  "https://www.reddit.com/r/HealthcareIT/new.rss?limit=25",
  "https://www.reddit.com/r/sales/new.rss?limit=25",
  "https://www.reddit.com/r/automation/new.rss?limit=25",
  "https://www.reddit.com/r/dentistry/new.rss?limit=25",
  "https://www.reddit.com/r/Insurance/new.rss?limit=25",
  "https://www.reddit.com/search.rss?q=voice+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=vapi+retell&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+call+center&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=voice+agent+latency&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=conversational+ai+calling&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=voice+ai+agent&sort=new",
  "https://www.reddit.com/search.rss?q=ai+receptionist&sort=new",
  "https://www.reddit.com/search.rss?q=vapi+alternative&sort=new",
  "https://www.reddit.com/search.rss?q=retell+ai+review&sort=new",
  "https://www.reddit.com/search.rss?q=bland+ai&sort=new",
  "https://www.reddit.com/search.rss?q=ai+call+center+problem&sort=new",
  "https://www.reddit.com/search.rss?q=replace+receptionist+ai&sort=new",
  "https://www.reddit.com/r/Entrepreneur/search.rss?q=voice+ai&sort=new",
  "https://www.reddit.com/r/smallbusiness/search.rss?q=missed+calls&sort=new",
  "https://www.reddit.com/r/SaaS/search.rss?q=voice+agent&sort=new",
];

const ENGAGE_HN_QUERIES = [
  "voice ai agent",
  "ai phone calling",
  "voice synthesis latency",
  "ai call center",
];

interface RawItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedAt: string;
  platform: "reddit" | "hn";
}

const engageParser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NewsFlowBot/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

async function fetchRedditEngageItems(): Promise<RawItem[]> {
  const results: RawItem[] = [];
  const cutoff = Date.now() - FRESHNESS_WINDOW;

  await Promise.allSettled(
    ENGAGE_REDDIT_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await engageParser.parseURL(feedUrl);
        for (const item of (feed.items || []).slice(0, 15)) {
          const title = item.title?.trim() || "";
          const url = item.link?.trim() || "";
          if (!title || !url) continue;
          const publishedAt = item.isoDate
            ? new Date(item.isoDate).toISOString()
            : new Date().toISOString();
          if (new Date(publishedAt).getTime() < cutoff) continue;
          const rawText = item.contentSnippet || item.content || item.summary || "";
          const snippet = rawText
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);

          // Extract subreddit from feed URL
          const sub = feedUrl.match(/\/r\/([^/]+)/)?.[1] ?? "reddit";
          results.push({
            title,
            snippet,
            url,
            source: `Reddit · r/${sub}`,
            publishedAt,
            platform: "reddit",
          });
        }
      } catch {
        // silent — feeds may be rate-limited
      }
    })
  );

  return results;
}

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  story_text?: string;
  url?: string;
  story_url?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
}

async function fetchHNEngageItems(): Promise<RawItem[]> {
  const results: RawItem[] = [];
  const cutoff = Date.now() - FRESHNESS_WINDOW;

  await Promise.allSettled(
    ENGAGE_HN_QUERIES.map(async (query) => {
      try {
        const encoded = encodeURIComponent(query);
        const apiUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encoded}&tags=story&numericFilters=created_at_i>=${Math.floor(cutoff / 1000)}&hitsPerPage=10`;
        const res = await fetch(apiUrl, {
          signal: AbortSignal.timeout(6000),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { hits?: HNHit[] };
        for (const hit of data.hits || []) {
          const title = (hit.title || hit.story_title || "").trim();
          const url =
            hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
          if (!title) continue;
          const publishedAt = hit.created_at
            ? new Date(hit.created_at).toISOString()
            : new Date().toISOString();
          if (new Date(publishedAt).getTime() < cutoff) continue;
          const snippet = (hit.story_text || "")
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);
          results.push({
            title,
            snippet,
            url,
            source: `Hacker News${hit.points ? ` · ${hit.points} pts` : ""}`,
            publishedAt,
            platform: "hn",
          });
        }
      } catch {
        // silent
      }
    })
  );

  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// ── Batch engagement analysis ─────────────────────────────────────────────────

interface BatchEngageResult {
  index: number;
  isEngageable: boolean;
  isConversational: boolean;
  engagementAngle: string;
  replyDraft: string;
  score: number;
}

async function batchGenerateEngagement(
  items: { title: string; snippet: string; tag: EngageTopicTag }[]
): Promise<BatchEngageResult[]> {
  if (items.length === 0) return [];

  const itemsText = items
    .map(
      (item, i) =>
        `[${i + 1}] Tag: ${item.tag}\nTitle: ${item.title}\nContext: ${item.snippet}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are a community engagement strategist for Smallest AI, a Voice AI platform.
Your goal: identify PUBLIC DISCUSSION THREADS where a Smallest AI team member can reply and add genuine value — building brand awareness and expertise without being spammy or promotional.

CRITICAL RULE — isConversational:
Set isConversational: true ONLY if the post is a live discussion where a human is:
  ✓ Asking a question (title or body contains "?")
  ✓ Seeking recommendations: "looking for", "recommend", "alternatives to", "what's the best", "which is better", "should I", "any suggestions"
  ✓ Expressing a problem or frustration: "frustrated with", "struggling with", "having issues", "doesn't work", "too expensive", "switched from", "failing", "help with"
  ✓ Comparing options: "vs", "compared to", "X vs Y", "anyone tried"
  ✓ Requesting advice or thoughts: "advice on", "thoughts on", "how do I", "how to"

Set isConversational: false if the post is:
  ✗ A news article or press release ("announces", "launches", "raises $X", "series A/B/C", "funding round", "partners with", "acquires", "reports that", "according to")
  ✗ A product launch announcement or company update
  ✗ A blog post or editorial with no question or discussion element
  ✗ A curated list, roundup, or summary article

SCORING RULES:
- Non-conversational posts: score MUST be ≤ 3 regardless of topic relevance
- Conversational posts: score normally
  · 8–10: Direct question about voice AI, competitor comparison, or clear pain point — replying would be high-impact
  · 5–7: Moderate relevance, genuine discussion thread worth joining
  · 1–4: Peripheral relevance or low engagement value`;

  const userPrompt = `Evaluate these threads for Smallest AI community engagement:

${itemsText}

For each thread worth engaging with, return:
1. isConversational (true/false per the rules above)
2. isEngageable (true only if adding a comment would genuinely add value)
3. An engagement angle (why and how to engage — 1 sentence)
4. A draft public comment (2–4 sentences, adds genuine value, not an ad, can mention Smallest AI naturally if relevant)
5. A score (1–10, following the scoring rules)

Return JSON array including ALL items that matched a keyword (set isEngageable: false for low-value ones):
[
  {
    "index": 1,
    "isConversational": true,
    "isEngageable": true,
    "engagementAngle": "Why/how to engage",
    "replyDraft": "Draft comment text",
    "score": 8
  }
]

Return [] if none qualify. Only include items where a comment would genuinely add value.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as BatchEngageResult[];
  } catch {
    return [];
  }
}

// ── In-memory cache ────────────────────────────────────────────────────────────

let cachedEngage: EngageItem[] = [];
let cachedEngageIsDemo = false;
let lastEngageFetch = 0;
const ENGAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchEngageItems(
  forceRefresh = false
): Promise<{ items: EngageItem[]; isDemo: boolean }> {
  const now = Date.now();
  if (!forceRefresh && lastEngageFetch > 0 && now - lastEngageFetch < ENGAGE_CACHE_TTL) {
    return { items: cachedEngage, isDemo: cachedEngageIsDemo };
  }

  const [redditItems, hnItems] = await Promise.all([
    fetchRedditEngageItems(),
    fetchHNEngageItems(),
  ]);

  const allContent: RawItem[] = [...redditItems, ...hnItems];

  // Pre-filter: must match at least one engage keyword
  const candidates = allContent.filter((item) => {
    const tag = detectTopicTag(`${item.title} ${item.snippet}`);
    return tag !== null;
  });

  if (candidates.length === 0) {
    cachedEngage = [];
    cachedEngageIsDemo = false;
    lastEngageFetch = now;
    return { items: [], isDemo: false };
  }

  // Deduplicate, sort by recency, cap at 40
  const seenUrls = new Set<string>();
  const unique = candidates
    .filter((c) => {
      if (seenUrls.has(c.url)) return false;
      seenUrls.add(c.url);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 40);

  // Batch analyze in groups of 8
  const BATCH_SIZE = 8;
  const engageItems: EngageItem[] = [];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const batchInput = batch.map((item) => ({
      title: item.title,
      snippet: item.snippet.slice(0, 300),
      tag: detectTopicTag(`${item.title} ${item.snippet}`) || "voice-ai-discussion",
    }));

    const results = await batchGenerateEngagement(batchInput);

    for (const result of results) {
      const item = batch[result.index - 1];
      // Skip if not engageable or not conversational
      if (!item || !result.isEngageable || !result.isConversational) continue;

      const score = Math.min(10, Math.max(1, Math.round(result.score)));
      const tier: EngageItem["tier"] =
        score >= 8 ? "hot" : score >= 5 ? "warm" : "watching";

      engageItems.push({
        id: uuidv4(),
        title: item.title,
        snippet: item.snippet,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        platform: item.platform,
        topicTag: detectTopicTag(`${item.title} ${item.snippet}`) || "voice-ai-discussion",
        engagementAngle: result.engagementAngle,
        replyDraft: result.replyDraft,
        score,
        tier,
        isConversational: true,
      });
    }
  }

  engageItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (engageItems.length === 0) {
    cachedEngage = [];
    cachedEngageIsDemo = false;
    lastEngageFetch = now;
    return { items: [], isDemo: false };
  }

  cachedEngage = engageItems;
  cachedEngageIsDemo = false;
  lastEngageFetch = now;
  return { items: engageItems, isDemo: false };
}
