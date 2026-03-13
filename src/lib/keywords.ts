import type { KeywordGroup, RSSSource } from "@/types";

export const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    label: "Voice AI Core",
    category: "voice-ai",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15 text-violet-300 border-violet-500/30",
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
    color: "text-blue-400",
    bgColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
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
    ],
  },
  {
    label: "Market Intel",
    category: "market-intel",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
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
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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
    color: "text-rose-400",
    bgColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
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

  // Priority order: voice-ai > use-case > market-intel > cx > ai-news
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
  // Voice AI Specific - High Priority
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
  // AI News - Broad
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
  // Newsletters
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
  // CX & Contact Center
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
  // Additional AI / Tech News
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
  // Startups & Funding
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
    name: "Hacker News",
    slug: "hackernews",
    url: "https://news.ycombinator.com/rss",
    priority: "medium",
    category: "ai-news",
  },
  {
    name: "Product Hunt",
    slug: "producthunt",
    url: "https://www.producthunt.com/feed",
    priority: "medium",
    category: "market-intel",
  },
];

export const CATEGORY_META: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  "voice-ai": {
    label: "Voice AI",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
    dotColor: "bg-violet-400",
  },
  "use-case": {
    label: "Use Case",
    color: "text-blue-400",
    bgColor: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  "market-intel": {
    label: "Market Intel",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    dotColor: "bg-amber-400",
  },
  cx: {
    label: "CX & CC",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  "ai-news": {
    label: "AI News",
    color: "text-rose-400",
    bgColor: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    dotColor: "bg-rose-400",
  },
};
