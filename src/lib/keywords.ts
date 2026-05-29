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
      "appointment booking ai",
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
      "property ai assistant",
      "ai for restaurants",
      "restaurant reservation ai",
      "ai recruitment",
      "hr voice bot",
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
      "vapi ai",
      "vapi",
      "retell ai",
      "retell",
      "elevenlabs",
      "bland ai",
      "synthflow",
      "voice ai startup",
      "voice ai funding",
      "conversational ai investment",
      "voice ai company",
      "voice ai platform",
      "voice ai acquisition",
      "voice ai partnership",
    ],
  },
  {
    label: "CX & Contact Center",
    category: "cx",
    keywords: [
      "contact center ai",
      "call center ai",
      "customer experience ai",
      "customer service automation",
      "ivr replacement",
      "interactive voice response",
      "cx automation",
      "omnichannel ai",
      "contact center automation",
    ],
  },
  {
    label: "AI News",
    category: "ai-news",
    keywords: [
      "large language model",
      "llm",
      "generative ai",
      "ai agent",
      "openai",
      "anthropic",
      "google ai",
      "microsoft ai",
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

// Curated RSS sources — focused on voice AI and direct industry relevance.
// Removed broad tech sources (The Verge, Ars Technica, Ben's Bites, TLDR AI)
// that were pulling in too many irrelevant articles.
export const RSS_SOURCES: RSSSource[] = [
  // Voice AI — High Priority (always show)
  {
    name: "Voicebot.ai",
    slug: "voicebot",
    url: "https://voicebot.ai/feed/",
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
  // AI News — Medium Priority (keyword-filtered)
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
    name: "MIT Tech Review",
    slug: "mitreview",
    url: "https://www.technologyreview.com/feed/",
    priority: "medium",
    category: "ai-news",
  },
  // CX & Contact Center
  {
    name: "CX Today",
    slug: "cxtoday",
    url: "https://cxtoday.com/feed",
    priority: "medium",
    category: "cx",
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
  "bland ai",
  "synthflow",
];

export const LEAD_KEYWORDS = [
  "voice ai",
  "ai voice agent",
  "voice bot",
  "ai receptionist",
  "ai call center",
  "ai contact center",
  "ai phone agent",
  "conversational ai",
  "ai scheduling",
  "automated calling",
  "telephony ai",
];
