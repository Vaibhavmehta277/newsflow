import type { KeywordGroup, RSSSource } from "@/types";

export const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    label: "Voice AI Core",
    category: "voice-ai",
    keywords: [
      "voice ai",
      "ai voice agent",
      "voice bot",
      "voicebot",
      "ai receptionist",
      "virtual receptionist",
      "ai front desk",
      "ai call center",
      "ai contact center",
      "conversational ai",
      "outbound ai calling",
      "ai sales calls",
      "automated calling",
      "ai scheduling",
      "ai phone agent",
      "text to speech",
      "tts",
      "neural voice",
      "speech synthesis",
      "voice cloning",
      "real-time voice",
      "voice api",
      "telephony ai",
    ],
  },
  {
    label: "Use Cases",
    category: "use-case",
    keywords: [
      "ai for healthcare",
      "medical receptionist ai",
      "clinic automation",
      "ai for real estate",
      "ai for restaurants",
      "restaurant reservation ai",
      "ai recruitment",
      "ai interviewer",
      "ai customer support",
      "automated customer service",
      "ai for insurance",
      "ai for banking",
      "ai for hospitality",
    ],
  },
  {
    label: "Market Intel",
    category: "market-intel",
    keywords: [
      "vapi",
      "retell ai",
      "retell",
      "elevenlabs",
      "bland ai",
      "synthflow",
      "voice ai startup",
      "voice ai funding",
      "voice ai company",
      "voice ai platform",
      "voice ai acquisition",
    ],
  },
  {
    label: "CX & Contact Center",
    category: "cx",
    keywords: [
      "contact center ai",
      "call center ai",
      "customer experience ai",
      "ivr replacement",
      "cx automation",
      "contact center automation",
    ],
  },
  {
    label: "AI News",
    category: "ai-news",
    keywords: [
      "large language model",
      "generative ai",
      "ai agent",
      "openai",
      "anthropic",
      "ai startup funding",
    ],
  },
];

export const ALL_KEYWORDS = KEYWORD_GROUPS.flatMap((g) =>
  g.keywords.map((kw) => ({ keyword: kw, category: g.category, group: g }))
);

export function detectKeywords(text: string): {
  keywords: string[];
  category: import("@/types").ArticleCategory;
} {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  const priorityOrder: import("@/types").ArticleCategory[] = [
    "voice-ai",
    "use-case",
    "market-intel",
    "cx",
    "ai-news",
  ];

  const categoryMatches: Record<string, string[]> = {};

  for (const { keyword, category } of ALL_KEYWORDS) {
    if (lower.includes(keyword)) {
      matched.push(keyword);
      if (!categoryMatches[category]) categoryMatches[category] = [];
      categoryMatches[category].push(keyword);
    }
  }

  let topCategory: import("@/types").ArticleCategory = "ai-news";
  for (const cat of priorityOrder) {
    if (categoryMatches[cat]?.length) {
      topCategory = cat;
      break;
    }
  }

  return {
    keywords: Array.from(new Set(matched)).slice(0, 5),
    category: topCategory,
  };
}

// ─── RSS Sources ──────────────────────────────────────────────────────────────
// Organized by PURPOSE, not by blog name. Each source is tagged so articles
// route automatically to the correct section (Competitor Watch, Lead Alerts, Feed).

export const RSS_SOURCES: RSSSource[] = [
  // ── COMPETITOR TRACKING (Google News — last 7 days) ──
  {
    name: "Google News",
    slug: "gnews-vapi",
    url: "https://news.google.com/rss/search?q=vapi+ai+OR+%22vapi+voice%22+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "market-intel",
    tag: "competitor",
  },
  {
    name: "Google News",
    slug: "gnews-retell",
    url: "https://news.google.com/rss/search?q=%22retell+ai%22+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "market-intel",
    tag: "competitor",
  },
  {
    name: "Google News",
    slug: "gnews-elevenlabs",
    url: "https://news.google.com/rss/search?q=elevenlabs+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "market-intel",
    tag: "competitor",
  },
  {
    name: "Google News",
    slug: "gnews-blandai",
    url: "https://news.google.com/rss/search?q=%22bland+ai%22+voice+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "market-intel",
    tag: "competitor",
  },
  {
    name: "Google News",
    slug: "gnews-synthflow",
    url: "https://news.google.com/rss/search?q=synthflow+voice+ai+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "market-intel",
    tag: "competitor",
  },

  // ── LEAD SIGNALS (Google News — companies deploying voice AI) ──
  {
    name: "Google News",
    slug: "gnews-voice-deploy",
    url: "https://news.google.com/rss/search?q=%22voice+ai%22+launches+OR+deploys+OR+adopts+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "use-case",
    tag: "lead",
  },
  {
    name: "Google News",
    slug: "gnews-ai-receptionist",
    url: "https://news.google.com/rss/search?q=%22ai+receptionist%22+OR+%22ai+phone+agent%22+OR+%22voice+bot%22+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "voice-ai",
    tag: "lead",
  },
  {
    name: "Google News",
    slug: "gnews-ccai",
    url: "https://news.google.com/rss/search?q=%22contact+center%22+ai+automation+voice+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "cx",
    tag: "lead",
  },

  // ── INDUSTRY NEWS (Google News + curated blogs) ──
  {
    name: "Google News",
    slug: "gnews-voiceai",
    url: "https://news.google.com/rss/search?q=%22voice+ai%22+agent+OR+platform+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "voice-ai",
    tag: "industry",
  },
  {
    name: "Voicebot.ai",
    slug: "voicebot",
    url: "https://voicebot.ai/feed/",
    priority: "high",
    category: "voice-ai",
    tag: "industry",
  },
  {
    name: "TechCrunch AI",
    slug: "techcrunch",
    url: "https://techcrunch.com/category/artificial-intelligence/feed",
    priority: "medium",
    category: "ai-news",
    tag: "industry",
  },
  {
    name: "VentureBeat AI",
    slug: "venturebeat",
    url: "https://venturebeat.com/category/ai/feed",
    priority: "medium",
    category: "ai-news",
    tag: "industry",
  },

  // ── COMMUNITY (Reddit, Hacker News) ──
  {
    name: "Reddit",
    slug: "reddit-voiceai",
    url: "https://www.reddit.com/search.rss?q=%22voice+ai%22+OR+%22voice+agent%22+OR+vapi+OR+retell+OR+elevenlabs&sort=new&t=week",
    priority: "medium",
    category: "voice-ai",
    tag: "community",
  },
  {
    name: "Hacker News",
    slug: "hn-voiceai",
    url: "https://hnrss.org/newest?q=%22voice+ai%22+OR+vapi+OR+retell+OR+elevenlabs&count=20",
    priority: "medium",
    category: "ai-news",
    tag: "community",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  "voice-ai": "Voice AI",
  "use-case": "Use Case",
  "market-intel": "Market Intel",
  cx: "CX & Contact Center",
  "ai-news": "AI News",
};

export const COMPETITOR_NAMES = [
  "vapi",
  "retell",
  "elevenlabs",
  "eleven labs",
  "bland ai",
  "synthflow",
];
