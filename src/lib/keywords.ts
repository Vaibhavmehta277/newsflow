import type { KeywordGroup, RSSSource } from "@/types";

export const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    label: "Voice AI Core",
    category: "voice-ai",
    color: "text-[var(--accent)]",
    bgColor: "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]",
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
      "appointment booking ai",
      "ai scheduling",
      "ai phone agent",
      "text to speech",
      "tts",
      "neural voice",
      "speech synthesis",
    ],
  },
  {
    label: "Use Cases",
    category: "use-case",
    color: "text-[var(--text-secondary)]",
    bgColor: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]",
    keywords: [
      // original
      "ai for healthcare",
      "medical receptionist ai",
      "clinic automation",
      "ai for real estate",
      "property ai assistant",
      "ai for restaurants",
      "restaurant reservation ai",
      "ai recruitment",
      "hr voice bot",
      "ai interviewer",
      "ai customer support",
      "automated customer service",
      // new — broader use-case signals
      "use case",
      "customer story",
      "case study",
      "how we built",
      "how i use",
      "real world",
      "in production",
      "deployed",
      "saves time",
      "real-world deployment",
      "production ai",
      "customer success",
      "workflow automation",
      "roi of ai",
    ],
  },
  {
    label: "Market Intel",
    category: "market-intel",
    color: "text-[var(--amber)]",
    bgColor: "bg-[var(--amber-subtle)] text-[var(--amber)] border-[var(--amber)]",
    keywords: [
      "vapi ai",
      "retell ai",
      "elevenlabs",
      "bland ai",
      "synthflow",
      "voice ai startup",
      "voice ai funding",
      "conversational ai investment",
      "voice ai company",
      "voice ai platform",
    ],
  },
  {
    label: "CX & Contact Center",
    category: "cx",
    color: "text-[var(--green)]",
    bgColor: "bg-[var(--green-subtle)] text-[var(--green)] border-[var(--green)]",
    keywords: [
      "contact center",
      "call center",
      "customer experience",
      "customer service automation",
      "ivr",
      "interactive voice response",
      "cx automation",
      "omnichannel",
    ],
  },
  {
    label: "AI News",
    category: "ai-news",
    color: "text-[var(--text-secondary)]",
    bgColor: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]",
    keywords: [
      "artificial intelligence",
      "large language model",
      "llm",
      "generative ai",
      "ai agent",
      "openai",
      "anthropic",
      "google ai",
      "microsoft ai",
      "ai startup",
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
  let topCategory: import("@/types").ArticleCategory = "ai-news";

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

export const RSS_SOURCES: RSSSource[] = [
  // ── Voice AI Specific — High Priority ──────────────────────────────────────
  {
    name: "Voicebot.ai",
    slug: "voicebot",
    url: "https://voicebot.ai/feed/",
    priority: "high",
    category: "voice-ai",
  },
  {
    name: "Chatbots Life",
    slug: "chatbotslife",
    url: "https://chatbotslife.com/feed",
    priority: "high",
    category: "voice-ai",
  },
  {
    name: "Kore.ai Blog",
    slug: "koreai",
    url: "https://blog.kore.ai/rss.xml",
    priority: "high",
    category: "voice-ai",
  },
  {
    name: "Yellow.ai",
    slug: "yellowai",
    url: "https://yellow.ai/feed",
    priority: "high",
    category: "voice-ai",
  },
  // ── Reliable Broad AI News ──────────────────────────────────────────────────
  {
    name: "TechCrunch AI",
    slug: "techcrunch",
    url: "https://techcrunch.com/category/artificial-intelligence/feed",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "VentureBeat AI",
    slug: "venturebeat",
    url: "https://venturebeat.com/category/ai/feed",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "The Verge",
    slug: "theverge",
    url: "https://www.theverge.com/rss/index.xml",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "Ars Technica",
    slug: "arstechnica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "MIT Tech Review",
    slug: "mitreview",
    url: "https://www.technologyreview.com/feed/",
    priority: "medium",
    category: "ai-news",
  },
  // ── HN / Community ─────────────────────────────────────────────────────────
  {
    name: "Hacker News",
    slug: "hackernews",
    url: "https://hnrss.org/frontpage",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "HN Voice AI",
    slug: "hn-voice-ai",
    url: "https://hnrss.org/newest?q=voice+ai",
    priority: "high",
    category: "voice-ai",
  },
  {
    name: "HN AI Agents",
    slug: "hn-ai-agents",
    url: "https://hnrss.org/newest?q=ai+agent",
    priority: "medium",
    category: "ai-news",
  },
  // ── Reddit ──────────────────────────────────────────────────────────────────
  {
    name: "Reddit AI",
    slug: "reddit-ai",
    url: "https://www.reddit.com/r/artificial/new/.rss",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "Reddit ML",
    slug: "reddit-ml",
    url: "https://www.reddit.com/r/MachineLearning/new/.rss",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "Reddit Startups",
    slug: "reddit-startups",
    url: "https://www.reddit.com/r/startups/new/.rss",
    priority: "medium",
    category: "ai-news",
  },
  // ── Newsletters ─────────────────────────────────────────────────────────────
  {
    name: "Ben's Bites",
    slug: "bensbites",
    url: "https://bensbites.beehiiv.com/feed",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "TLDR AI",
    slug: "tldrai",
    url: "https://tldr.tech/ai/rss",
    priority: "medium",
    category: "ai-news",
  },
  // ── CX & Contact Center ─────────────────────────────────────────────────────
  {
    name: "CX Today",
    slug: "cxtoday",
    url: "https://cxtoday.com/feed",
    priority: "medium",
    category: "cx",
  },
  {
    name: "Customer Think",
    slug: "customerthink",
    url: "https://customerthink.com/feed",
    priority: "medium",
    category: "cx",
  },
  {
    name: "CallCentre Helper",
    slug: "callcentrehelper",
    url: "https://www.callcentrehelper.com/feed",
    priority: "medium",
    category: "cx",
  },
  // ── Additional Tech / AI ────────────────────────────────────────────────────
  {
    name: "Wired",
    slug: "wired",
    url: "https://www.wired.com/feed/rss",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "AI News",
    slug: "ainews",
    url: "https://www.artificialintelligence-news.com/feed/",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "SiliconAngle",
    slug: "siliconangle",
    url: "https://siliconangle.com/feed/",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "ZDNet AI",
    slug: "zdnet",
    url: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "The Next Web",
    slug: "thenextweb",
    url: "https://thenextweb.com/feed",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "InfoWorld AI",
    slug: "infoworld",
    url: "https://www.infoworld.com/category/artificial-intelligence/index.rss",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "ComputerWorld AI",
    slug: "computerworld",
    url: "https://www.computerworld.com/category/artificial-intelligence/index.rss",
    priority: "medium",
    category: "ai-news",
  },
  // ── Startups & Funding ──────────────────────────────────────────────────────
  {
    name: "Crunchbase News",
    slug: "crunchbase",
    url: "https://news.crunchbase.com/feed",
    priority: "medium",
    category: "market-intel",
  },
  {
    name: "TechCrunch Startups",
    slug: "techcrunch-startups",
    url: "https://techcrunch.com/category/startups/feed",
    priority: "medium",
    category: "market-intel",
  },
  {
    name: "Sifted",
    slug: "sifted",
    url: "https://sifted.eu/feed",
    priority: "medium",
    category: "market-intel",
  },
  {
    name: "Inc42",
    slug: "inc42",
    url: "https://inc42.com/feed/",
    priority: "medium",
    category: "market-intel",
  },
  {
    name: "Product Hunt",
    slug: "producthunt",
    url: "https://www.producthunt.com/feed",
    priority: "medium",
    category: "market-intel",
  },
  {
    name: "VentureBeat AI (alt)",
    slug: "venturebeat-alt",
    url: "https://feeds.feedburner.com/venturebeat/SZYF",
    priority: "medium",
    category: "ai-news",
  },
];

export const CATEGORY_META: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  "voice-ai": {
    label: "Voice AI",
    color: "text-[var(--accent)]",
    bgColor: "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]",
    dotColor: "bg-[var(--accent)]",
  },
  "use-case": {
    label: "Use Case",
    color: "text-[var(--text-secondary)]",
    bgColor: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]",
    dotColor: "bg-[var(--text-secondary)]",
  },
  "market-intel": {
    label: "Market Intel",
    color: "text-[var(--amber)]",
    bgColor: "bg-[var(--amber-subtle)] text-[var(--amber)] border border-[var(--amber)]",
    dotColor: "bg-[var(--amber)]",
  },
  cx: {
    label: "CX & CC",
    color: "text-[var(--green)]",
    bgColor: "bg-[var(--green-subtle)] text-[var(--green)] border border-[var(--green)]",
    dotColor: "bg-[var(--green)]",
  },
  "ai-news": {
    label: "AI News",
    color: "text-[var(--text-secondary)]",
    bgColor: "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]",
    dotColor: "bg-[var(--text-secondary)]",
  },
};
