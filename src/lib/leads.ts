import OpenAI from "openai";
import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import type { LeadItem, LeadTriggerCategory } from "@/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── Freshness cutoff ─────────────────────────────────────────────────────────
const FRESHNESS_48H = 48 * 60 * 60 * 1000;

// ── Trigger phrase groups (multi-word exact phrases) ────────────────────────

const TRIGGER_GROUPS: {
  category: LeadTriggerCategory;
  phrases: string[];
}[] = [
  {
    category: "pain-point",
    phrases: [
      "our phone system is terrible",
      "we keep missing calls",
      "customers always on hold",
      "lost a lead because",
      "receptionist quit",
      "hard to hire receptionists",
      "can't find good receptionists",
      "phone tag",
      "voicemail full",
      "after-hours calls",
      "missed calls are costing",
      "our staff can't keep up with calls",
      "appointment no-shows",
      "manual follow-up",
      "patient scheduling nightmare",
      "constantly missing appointments",
      "call volume too high",
      "overwhelmed with calls",
      "phone system is outdated",
      "dropping calls",
      "too many calls to handle",
      "can't scale our phone support",
      "no one answering the phone",
      "front desk is overwhelmed",
      "booking system is broken",
    ],
  },
  {
    category: "solution-seeking",
    phrases: [
      "looking for voice ai",
      "need ai calling solution",
      "automate phone calls",
      "ai for appointments",
      "virtual receptionist software",
      "best ai phone answering",
      "replace our receptionist",
      "ai outbound calling",
      "intelligent ivr",
      "conversational ai for calls",
      "voice automation tool",
      "ai appointment setter",
      "robocall alternative",
      "ai phone system recommendation",
      "automated call answering",
      "ai to handle inbound calls",
      "tools to automate calls",
      "looking for call automation",
      "recommendation for voice ai",
      "best ai for phone calls",
      "automated scheduling calls",
    ],
  },
  {
    category: "competitor-comparison",
    phrases: [
      "vapi vs retell",
      "vapi alternative",
      "retell ai pricing",
      "bland ai review",
      "synthflow vs",
      "elevenlabs for calls",
      "better than vapi",
      "vapi too expensive",
      "retell ai support",
      "which voice ai is best",
      "comparing voice ai",
      "switched from vapi",
      "switched from bland",
      "retell vs bland",
      "deepgram vs",
      "voice ai platform comparison",
      "best twilio alternative",
      "looking for twilio alternative",
      "cheaper than twilio",
      "genesys alternative",
    ],
  },
  {
    category: "industry-specific",
    phrases: [
      "dental office phone",
      "medical scheduling ai",
      "real estate follow-up calls",
      "insurance outbound calls",
      "auto dealer appointment",
      "hotel reservation voice",
      "law firm intake calls",
      "financial advisor calls",
      "mortgage call center",
      "restaurant reservation system",
      "clinic front desk",
      "healthcare call automation",
      "patient reminder calls",
      "property inquiry calls",
      "insurance agent calls",
      "car dealership calls",
      "spa booking calls",
      "salon appointment calls",
      "gym member calls",
      "logistics dispatch calls",
    ],
  },
];

// Flat lookup: phrase → category
const PHRASE_TO_CATEGORY = new Map<string, LeadTriggerCategory>();
for (const group of TRIGGER_GROUPS) {
  for (const phrase of group.phrases) {
    PHRASE_TO_CATEGORY.set(phrase.toLowerCase(), group.category);
  }
}

// ── Broad keywords (short 1-3 word signals that match more content) ─────────

const BROAD_KEYWORDS: { keyword: string; category: LeadTriggerCategory }[] = [
  // pain-point signals
  { keyword: "missed calls", category: "pain-point" },
  { keyword: "missing calls", category: "pain-point" },
  { keyword: "phone system", category: "pain-point" },
  { keyword: "after hours", category: "pain-point" },
  { keyword: "after-hours", category: "pain-point" },
  { keyword: "voicemail", category: "pain-point" },
  { keyword: "receptionist", category: "pain-point" },
  { keyword: "call volume", category: "pain-point" },
  { keyword: "front desk", category: "pain-point" },
  { keyword: "no-show", category: "pain-point" },
  { keyword: "follow-up calls", category: "pain-point" },
  { keyword: "follow up calls", category: "pain-point" },
  { keyword: "inbound calls", category: "pain-point" },
  { keyword: "overwhelmed", category: "pain-point" },
  { keyword: "losing leads", category: "pain-point" },
  { keyword: "dropped calls", category: "pain-point" },
  { keyword: "appointment reminders", category: "pain-point" },
  { keyword: "scheduling calls", category: "pain-point" },
  { keyword: "phone answering", category: "pain-point" },
  // solution-seeking signals
  { keyword: "voice ai", category: "solution-seeking" },
  { keyword: "ai calling", category: "solution-seeking" },
  { keyword: "ai receptionist", category: "solution-seeking" },
  { keyword: "call automation", category: "solution-seeking" },
  { keyword: "phone automation", category: "solution-seeking" },
  { keyword: "automate calls", category: "solution-seeking" },
  { keyword: "virtual receptionist", category: "solution-seeking" },
  { keyword: "ai phone", category: "solution-seeking" },
  { keyword: "conversational ai", category: "solution-seeking" },
  { keyword: "voice agent", category: "solution-seeking" },
  { keyword: "ai appointment", category: "solution-seeking" },
  { keyword: "outbound calls", category: "solution-seeking" },
  { keyword: "automated calling", category: "solution-seeking" },
  { keyword: "voice bot", category: "solution-seeking" },
  { keyword: "ai voice", category: "solution-seeking" },
  { keyword: "phone bot", category: "solution-seeking" },
  { keyword: "ivr replacement", category: "solution-seeking" },
  // competitor-comparison signals
  { keyword: "vapi", category: "competitor-comparison" },
  { keyword: "retell ai", category: "competitor-comparison" },
  { keyword: "bland ai", category: "competitor-comparison" },
  { keyword: "elevenlabs", category: "competitor-comparison" },
  { keyword: "synthflow", category: "competitor-comparison" },
  { keyword: "twilio voice", category: "competitor-comparison" },
  // industry-specific signals
  { keyword: "dental practice", category: "industry-specific" },
  { keyword: "dental office", category: "industry-specific" },
  { keyword: "medical office", category: "industry-specific" },
  { keyword: "medical practice", category: "industry-specific" },
  { keyword: "real estate leads", category: "industry-specific" },
  { keyword: "real estate calls", category: "industry-specific" },
  { keyword: "insurance agent", category: "industry-specific" },
  { keyword: "insurance calls", category: "industry-specific" },
  { keyword: "car dealership", category: "industry-specific" },
  { keyword: "auto dealership", category: "industry-specific" },
  { keyword: "healthcare", category: "industry-specific" },
  { keyword: "patient scheduling", category: "industry-specific" },
  { keyword: "patient calls", category: "industry-specific" },
  { keyword: "law firm", category: "industry-specific" },
  { keyword: "mortgage leads", category: "industry-specific" },
  { keyword: "salon booking", category: "industry-specific" },
  { keyword: "clinic calls", category: "industry-specific" },
];

// ── Demo data (shown when no real leads are found) ──────────────────────────
export const DEMO_LEAD_ITEMS: LeadItem[] = [
  {
    id: "demo-lead-1",
    title: "Anyone else losing customers because their receptionist can't keep up with call volume?",
    summary: "Small law firm here. Our receptionist is great but we're getting 60-80 calls a day and she just can't handle it. We're missing calls and losing potential clients. Looking for solutions.",
    url: "https://reddit.com/r/smallbusiness",
    source: "Reddit",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    triggerPhrases: ["receptionist", "missed calls", "call volume"],
    triggerCategory: "pain-point",
    outreachDraft: "Saw your post about missing calls at your law firm — that's a real problem that directly hits revenue. We built Smallest AI specifically for practices like yours where a single receptionist can't cover the volume. Happy to show you how we handle intake calls automatically, 24/7. Would a quick 15-min demo work?",
    score: 9,
    platform: "reddit",
  },
  {
    id: "demo-lead-2",
    title: "Best AI voice agent for outbound real estate follow-ups in 2024?",
    summary: "Running a real estate team of 12 agents. We generate about 200 leads/month but struggle to follow up quickly. Looking for an AI tool that can make the initial outreach call within 5 minutes of a lead coming in.",
    url: "https://reddit.com/r/RealEstate",
    source: "Reddit",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    triggerPhrases: ["voice agent", "real estate calls", "outbound calls"],
    triggerCategory: "solution-seeking",
    outreachDraft: "Your post about real estate lead follow-up is exactly our sweet spot — we power instant AI voice calls that trigger within seconds of a lead coming in. Our real estate customers see 3x more conversations because speed-to-call is everything. Want to see a live demo with your actual lead workflow?",
    score: 8,
    platform: "reddit",
  },
  {
    id: "demo-lead-3",
    title: "Comparing Vapi vs Retell AI for dental appointment reminders — which is better?",
    summary: "Dental practice owner. We're currently evaluating voice AI for patient reminders and appointment confirmations. Have demoed Vapi and Retell AI so far. Main concern is natural-sounding conversation and HIPAA compliance.",
    url: "https://reddit.com/r/HealthcareIT",
    source: "Reddit",
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    triggerPhrases: ["vapi", "retell ai", "dental office", "appointment reminders"],
    triggerCategory: "competitor-comparison",
    outreachDraft: "Saw you're comparing Vapi and Retell for your dental practice — good timing to also look at Smallest AI. We specialize in healthcare use cases with built-in HIPAA compliance and the most natural patient-facing voice in the market. We could do a quick side-by-side comparison for your specific workflow.",
    score: 8,
    platform: "reddit",
  },
  {
    id: "demo-lead-4",
    title: "Looking to automate phone calls for insurance agency — where to start?",
    summary: "I run an independent insurance agency with 5 agents. We spend too much time on routine calls — policy renewals, claim status updates, appointment reminders. Want to automate this but don't know where to start.",
    url: "https://reddit.com/r/entrepreneur",
    source: "Reddit",
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    triggerPhrases: ["automate calls", "phone automation", "insurance agent"],
    triggerCategory: "industry-specific",
    outreachDraft: "Insurance agencies are one of our best use cases — renewals, claim updates, and appointment reminders are exactly what our voice agents handle. Your agents could reclaim 2-3 hours a day. I can set you up with a free pilot on your actual call scripts, no engineering needed. Interested?",
    score: 7,
    platform: "reddit",
  },
  {
    id: "demo-lead-5",
    title: "Front desk at our medical practice is completely overwhelmed — need help",
    summary: "We added 2 new physicians and our front desk is drowning. 150+ calls/day for scheduling, refills, referrals. Staff is burning out and patients are frustrated. Open to technology solutions.",
    url: "https://reddit.com/r/HealthcareIT",
    source: "Reddit",
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    triggerPhrases: ["front desk", "overwhelmed", "patient scheduling", "inbound calls"],
    triggerCategory: "pain-point",
    outreachDraft: "150 calls a day with an overwhelmed front desk is a tough spot — and it only gets worse as you add more physicians. Smallest AI can handle scheduling, refill routing, and referral intake automatically. We work with several multi-physician practices and typically cut front desk call load by 60%+. Would love to show you how it works.",
    score: 9,
    platform: "reddit",
  },
];

// ── Reddit sources for lead monitoring ─────────────────────────────────────

// Subreddit /new.rss — freshest posts from business/industry communities
const LEADS_REDDIT_SUBREDDITS = [
  "https://www.reddit.com/r/smallbusiness/new.rss?limit=25",
  "https://www.reddit.com/r/entrepreneur/new.rss?limit=25",
  "https://www.reddit.com/r/startups/new.rss?limit=25",
  "https://www.reddit.com/r/SaaS/new.rss?limit=25",
  "https://www.reddit.com/r/callcenters/new.rss?limit=25",
  "https://www.reddit.com/r/HealthcareIT/new.rss?limit=25",
  "https://www.reddit.com/r/RealEstate/new.rss?limit=25",
  "https://www.reddit.com/r/sales/new.rss?limit=25",
  "https://www.reddit.com/r/marketing/new.rss?limit=25",
  "https://www.reddit.com/r/automation/new.rss?limit=25",
  "https://www.reddit.com/r/b2bmarketing/new.rss?limit=25",
  "https://www.reddit.com/r/dentistry/new.rss?limit=25",
  "https://www.reddit.com/r/Insurance/new.rss?limit=25",
  "https://www.reddit.com/r/recruiting/new.rss?limit=25",
  "https://www.reddit.com/r/customerservice/new.rss?limit=25",
  "https://www.reddit.com/r/legaladvice/new.rss?limit=25",
  "https://www.reddit.com/r/msp/new.rss?limit=25",
  "https://www.reddit.com/r/veterinary/new.rss?limit=25",
  "https://www.reddit.com/r/physicaltherapy/new.rss?limit=25",
];

// Reddit keyword search RSS — targeted buying intent signals
const LEADS_REDDIT_SEARCHES = [
  "https://www.reddit.com/search.rss?q=voice+ai+receptionist&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=missed+calls+business&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+phone+answering&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=automate+phone+calls&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+appointment+scheduling&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=call+center+ai&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=vapi+retell+bland&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=virtual+receptionist+software&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=outbound+call+automation&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=phone+bot+business&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=ai+calling+tool&sort=new&limit=25",
  "https://www.reddit.com/search.rss?q=front+desk+automation&sort=new&limit=25",
];

const ALL_REDDIT_FEEDS = [...LEADS_REDDIT_SUBREDDITS, ...LEADS_REDDIT_SEARCHES];

// ── HN Algolia queries for lead signals ─────────────────────────────────────

const HN_LEAD_QUERIES = [
  "voice ai receptionist",
  "missed calls automated",
  "ai phone calling",
  "outbound calling automation",
];

// ── Content item interface ──────────────────────────────────────────────────

interface ContentItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  platform: "reddit" | "rss" | "hn";
}

// ── Helpers ────────────────────────────────────────────────────────────────

function detectTriggers(text: string): {
  phrases: string[];
  category: LeadTriggerCategory | null;
} {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  const categoryCounts = new Map<LeadTriggerCategory, number>();

  // Check multi-word exact phrases first
  for (const [phrase, category] of PHRASE_TO_CATEGORY.entries()) {
    if (lower.includes(phrase)) {
      matched.push(phrase);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  // Check broad short keywords (catch things like "voice ai", "receptionist", etc.)
  for (const { keyword, category } of BROAD_KEYWORDS) {
    if (lower.includes(keyword) && !matched.includes(keyword)) {
      matched.push(keyword);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  if (matched.length === 0) return { phrases: [], category: null };

  // Pick the category with the most matches
  let topCategory: LeadTriggerCategory = "pain-point";
  let topCount = 0;
  for (const [cat, count] of categoryCounts.entries()) {
    if (count > topCount) {
      topCount = count;
      topCategory = cat;
    }
  }

  return { phrases: matched.slice(0, 5), category: topCategory };
}

const leadsParser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; NewsFlowBot/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

// ── Fetch Reddit items (subreddits + keyword searches) ──────────────────────

async function fetchRedditLeadItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  let successCount = 0;
  let failCount = 0;
  const cutoff = Date.now() - FRESHNESS_48H;

  await Promise.allSettled(
    ALL_REDDIT_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await leadsParser.parseURL(feedUrl);
        const items = feed.items || [];
        successCount++;

        for (const item of items.slice(0, 15)) {
          const title = item.title?.trim() || "";
          const url = item.link?.trim() || "";
          if (!title || !url) continue;

          const publishedAt =
            item.isoDate || item.pubDate
              ? new Date(item.isoDate || item.pubDate || "").toISOString()
              : new Date().toISOString();

          // 48h freshness filter
          if (new Date(publishedAt).getTime() < cutoff) continue;

          const rawText = item.contentSnippet || item.content || item.summary || "";
          const summary = rawText
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);

          results.push({ title, summary, url, source: "Reddit", publishedAt, platform: "reddit" });
        }
      } catch (err) {
        failCount++;
        console.warn(`[Leads] Reddit feed FAILED: ${feedUrl}`, err instanceof Error ? err.message : err);
      }
    })
  );

  console.log(`[Leads] Reddit: ${successCount} OK, ${failCount} failed → ${results.length} items (48h)`);
  return results;
}

// ── Fetch HN items via Algolia ───────────────────────────────────────────────

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  story_text?: string;
  comment_text?: string;
  url?: string;
  story_url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  _tags?: string[];
}

async function fetchHNLeadItems(): Promise<ContentItem[]> {
  const results: ContentItem[] = [];
  const cutoff = Date.now() - FRESHNESS_48H;
  const since = new Date(cutoff).toISOString().split("T")[0];

  await Promise.allSettled(
    HN_LEAD_QUERIES.map(async (query) => {
      try {
        const encoded = encodeURIComponent(query);
        const apiUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encoded}&tags=story&numericFilters=created_at_i>=${Math.floor(cutoff / 1000)}&hitsPerPage=10`;

        const res = await fetch(apiUrl, {
          signal: AbortSignal.timeout(6000),
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          console.warn(`[Leads] HN query "${query}" returned ${res.status}`);
          return;
        }

        const data = (await res.json()) as { hits?: HNHit[] };
        const hits = data.hits || [];
        console.log(`[Leads] HN query "${query}" → ${hits.length} hits (since ${since})`);

        for (const hit of hits) {
          const title = (hit.title || hit.story_title || "").trim();
          const url =
            hit.url ||
            hit.story_url ||
            `https://news.ycombinator.com/item?id=${hit.objectID}`;

          if (!title) continue;

          const publishedAt = hit.created_at
            ? new Date(hit.created_at).toISOString()
            : new Date().toISOString();

          // Double-check freshness
          if (new Date(publishedAt).getTime() < cutoff) continue;

          const rawText = hit.story_text || hit.comment_text || "";
          const summary = rawText
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);

          results.push({
            title,
            summary,
            url,
            source: `HN (${hit.points || 0} pts)`,
            publishedAt,
            platform: "hn",
          });
        }
      } catch (err) {
        console.warn(`[Leads] HN query "${query}" error:`, err instanceof Error ? err.message : err);
      }
    })
  );

  // Deduplicate HN by URL
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[Leads] HN: ${deduped.length} unique items`);
  return deduped;
}

// ── Batch outreach generation ─────────────────────────────────────────────

interface BatchLeadResult {
  index: number;
  isLead: boolean;
  outreachDraft: string;
  score: number;
}

async function batchGenerateOutreach(
  items: { title: string; summary: string; triggers: string[]; category: LeadTriggerCategory }[]
): Promise<BatchLeadResult[]> {
  if (items.length === 0) return [];

  const itemsText = items
    .map(
      (item, i) =>
        `[${i + 1}] Category: ${item.category}\nTriggered by: ${item.triggers.join(", ")}\nTitle: ${item.title}\nContext: ${item.summary}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are a sales development representative for Smallest AI, a Voice AI company that builds AI voice agents for businesses.
Your job: identify posts that show genuine buying intent for a voice AI solution, and write personalized outreach.

Scoring (how ready this person is to buy):
- 8-10: Clear pain point + actively seeking solution, strong buying intent
- 5-7: Has pain but may not be actively searching
- 1-4: Vaguely relevant, low intent`;

  const userPrompt = `These posts may contain leads for Smallest AI's voice AI platform. Analyze each one.

${itemsText}

For each post that represents a genuine lead, return a personalized outreach draft (2-3 sentences, conversational, not salesy).

Return a JSON array with ONLY genuine leads:
[
  {
    "index": 1,
    "isLead": true,
    "outreachDraft": "Personalized outreach message that references their specific pain",
    "score": 8
  }
]

Return [] if none qualify. Focus on quality over quantity.`;

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
    console.log(`[Leads] OpenAI batch response (first 200 chars): ${responseText.slice(0, 200)}`);
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[Leads] OpenAI returned no JSON array");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as BatchLeadResult[];
    console.log(`[Leads] OpenAI identified ${parsed.length} leads`);
    return parsed;
  } catch (err) {
    console.error("[Leads] OpenAI batchGenerateOutreach error:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ── Slack notification ─────────────────────────────────────────────────────

async function notifySlack(item: LeadItem): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const categoryLabel = {
    "pain-point": "😤 Pain Point",
    "solution-seeking": "🔍 Solution Seeking",
    "competitor-comparison": "⚔️ Competitor Comparison",
    "industry-specific": "🏭 Industry Specific",
  }[item.triggerCategory];

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔥 *New Hot Lead (Score ${item.score}/10)* — ${categoryLabel}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🔥 *New Lead Signal — Score ${item.score}/10*\n*${item.title}*\n_${item.source}_`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Category:*\n${categoryLabel}` },
              {
                type: "mrkdwn",
                text: `*Triggers:*\n${item.triggerPhrases.slice(0, 3).join(", ")}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Suggested Outreach:*\n${item.outreachDraft}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View Post" },
                url: item.url,
              },
            ],
          },
        ],
      }),
    });
  } catch {
    // Don't fail the request if Slack notification fails
  }
}

// ── In-memory cache ────────────────────────────────────────────────────────

let cachedLeads: LeadItem[] = [];
let cachedLeadsIsDemo = false;
let lastLeadsFetch = 0;
const LEADS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchLeadItems(forceRefresh = false): Promise<{ items: LeadItem[]; isDemo: boolean }> {
  const now = Date.now();
  if (!forceRefresh && lastLeadsFetch > 0 && now - lastLeadsFetch < LEADS_CACHE_TTL) {
    console.log(`[Leads] Returning cached data (${cachedLeads.length} items, isDemo=${cachedLeadsIsDemo})`);
    return { items: cachedLeads, isDemo: cachedLeadsIsDemo };
  }

  console.log("[Leads] Starting fresh fetch…");

  // 1. Gather content from all sources in parallel
  const [redditItems, hnItems] = await Promise.all([
    fetchRedditLeadItems(),
    fetchHNLeadItems(),
  ]);

  console.log(`[Leads] Reddit: ${redditItems.length}, HN: ${hnItems.length}`);

  const allContent: ContentItem[] = [...redditItems, ...hnItems];

  console.log(`[Leads] Total content items: ${allContent.length}`);

  // 2. Pre-filter: must match at least one trigger phrase or broad keyword
  const candidates = allContent.filter((item) => {
    const text = `${item.title} ${item.summary}`;
    const { phrases } = detectTriggers(text);
    const isMatch = phrases.length > 0;
    if (isMatch) {
      console.log(`[Leads] MATCH: "${item.title.slice(0, 60)}" → [${phrases.slice(0, 3).join(", ")}]`);
    }
    return isMatch;
  });

  console.log(`[Leads] Candidates after trigger filter: ${candidates.length} / ${allContent.length}`);

  if (candidates.length === 0) {
    console.log("[Leads] No trigger matches found — returning demo data");
    cachedLeads = [];
    cachedLeadsIsDemo = true;
    lastLeadsFetch = now;
    return { items: DEMO_LEAD_ITEMS, isDemo: true };
  }

  // 3. Deduplicate by URL, sort by recency, cap at 40
  const seenUrls = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seenUrls.has(c.url)) return false;
    seenUrls.add(c.url);
    return true;
  });

  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const limited = unique.slice(0, 40);

  console.log(`[Leads] After dedup + sort + cap: ${limited.length} candidates going to OpenAI`);

  // 4. Batch analyze: groups of 8
  const BATCH_SIZE = 8;
  const batches: ContentItem[][] = [];
  for (let i = 0; i < limited.length; i += BATCH_SIZE) {
    batches.push(limited.slice(i, i + BATCH_SIZE));
  }

  console.log(`[Leads] Processing ${batches.length} batches of up to ${BATCH_SIZE}`);

  const leadItems: LeadItem[] = [];

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`[Leads] Batch ${batchIdx + 1}/${batches.length}: ${batch.length} items`);

    const batchInput = batch.map((item) => {
      const text = `${item.title} ${item.summary}`;
      const { phrases, category } = detectTriggers(text);
      return {
        title: item.title,
        summary: item.summary.slice(0, 300),
        triggers: phrases,
        category: category || "pain-point",
      };
    });

    const results = await batchGenerateOutreach(batchInput);

    for (const result of results) {
      const item = batch[result.index - 1];
      if (!item || !result.isLead) continue;

      const text = `${item.title} ${item.summary}`;
      const { phrases, category } = detectTriggers(text);
      const score = Math.min(10, Math.max(1, Math.round(result.score)));

      const leadItem: LeadItem = {
        id: uuidv4(),
        title: item.title,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt,
        triggerPhrases: phrases,
        triggerCategory: category || "pain-point",
        outreachDraft: result.outreachDraft,
        score,
        platform: item.platform,
      };

      leadItems.push(leadItem);

      // Notify Slack for high-score leads
      if (score >= 7) {
        console.log(`[Leads] Hot lead found (score ${score}): "${item.title.slice(0, 60)}"`);
        notifySlack(leadItem).catch(() => {});
      }
    }
  }

  // 5. Sort by score desc, then by recency desc
  leadItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  console.log(`[Leads] Final results: ${leadItems.length} leads (${leadItems.filter(i => i.score >= 7).length} hot)`);

  if (leadItems.length === 0) {
    console.log("[Leads] OpenAI found no genuine leads — returning demo data");
    cachedLeads = [];
    cachedLeadsIsDemo = true;
    lastLeadsFetch = now;
    return { items: DEMO_LEAD_ITEMS, isDemo: true };
  }

  cachedLeads = leadItems;
  cachedLeadsIsDemo = false;
  lastLeadsFetch = now;

  return { items: leadItems, isDemo: false };
}
