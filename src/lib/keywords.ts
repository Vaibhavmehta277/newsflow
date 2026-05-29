import type { KeywordGroup, RSSSource, SignalType } from "@/types";

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
      "vapi ai",
      "retell ai",
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
// Organized by PURPOSE. Each source is tagged so articles route automatically.

export const RSS_SOURCES: RSSSource[] = [
  // ── COMPETITOR TRACKING (Google News — last 7 days) ──
  {
    name: "Google News",
    slug: "gnews-vapi",
    url: "https://news.google.com/rss/search?q=%22vapi+ai%22+OR+%22vapi+voice%22+when:7d&hl=en-US&gl=US&ceid=US:en",
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
    url: "https://news.google.com/rss/search?q=%22voice+ai%22+%28launches+OR+deploys+OR+adopts+OR+partnership%29+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "use-case",
    tag: "lead",
  },
  {
    name: "Google News",
    slug: "gnews-ai-receptionist",
    url: "https://news.google.com/rss/search?q=%22ai+receptionist%22+OR+%22ai+phone+agent%22+OR+%22virtual+receptionist+ai%22+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "voice-ai",
    tag: "lead",
  },
  {
    name: "Google News",
    slug: "gnews-ccai",
    url: "https://news.google.com/rss/search?q=%22call+center+ai%22+OR+%22contact+center+ai%22+%28voice+OR+agent+OR+bot%29+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "cx",
    tag: "lead",
  },
  {
    name: "Google News",
    slug: "gnews-voice-bot-deploy",
    url: "https://news.google.com/rss/search?q=%22voice+bot%22+OR+%22voice+agent%22+%28launch+OR+deploy+OR+automate%29+when:7d&hl=en-US&gl=US&ceid=US:en",
    priority: "high",
    category: "voice-ai",
    tag: "lead",
  },

  // ── INDUSTRY NEWS (Google News + curated blogs) ──
  {
    name: "Google News",
    slug: "gnews-voiceai",
    url: "https://news.google.com/rss/search?q=%22voice+ai%22+agent+OR+platform+OR+startup+when:7d&hl=en-US&gl=US&ceid=US:en",
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

  // ── COMMUNITY (Reddit — specific subreddits + search) ──
  {
    name: "Reddit",
    slug: "reddit-voiceai",
    url: "https://www.reddit.com/search.rss?q=%22voice+ai%22+OR+%22voice+agent%22+OR+%22ai+receptionist%22+OR+%22ai+call+center%22&sort=new&t=week",
    priority: "high",
    category: "voice-ai",
    tag: "community",
  },
  {
    name: "Reddit",
    slug: "reddit-competitors",
    url: "https://www.reddit.com/search.rss?q=%22vapi+ai%22+OR+%22vapi%22+voice+OR+%22retell+ai%22+OR+elevenlabs+OR+%22bland+ai%22+OR+synthflow&sort=new&t=week",
    priority: "high",
    category: "market-intel",
    tag: "community",
  },
  {
    name: "Reddit",
    slug: "reddit-saas-ai",
    url: "https://www.reddit.com/r/SaaS/search.rss?q=voice+ai+OR+%22ai+agent%22+call&restrict_sr=1&sort=new&t=week",
    priority: "medium",
    category: "voice-ai",
    tag: "community",
  },
  {
    name: "Hacker News",
    slug: "hn-voiceai",
    url: "https://hnrss.org/newest?q=%22voice+ai%22+OR+%22voice+agent%22+OR+elevenlabs&count=20",
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

// Competitor detection — use specific enough terms to avoid false positives
// "retell" alone matches the English verb, so we use "retell ai"
export const COMPETITOR_NAMES = [
  "vapi",
  "retell ai",
  "elevenlabs",
  "eleven labs",
  "bland ai",
  "synthflow",
];

// More permissive matching for articles that are ALREADY from competitor-tagged sources
export const COMPETITOR_DISPLAY_NAMES: Record<string, string> = {
  vapi: "Vapi",
  "vapi ai": "Vapi",
  "retell ai": "Retell AI",
  retell: "Retell AI",
  elevenlabs: "ElevenLabs",
  "eleven labs": "ElevenLabs",
  "bland ai": "Bland AI",
  synthflow: "Synthflow",
};

// Pain point / opportunity detection keywords
export const PAIN_POINT_KEYWORDS = [
  "doesn't work",
  "not working",
  "broken",
  "terrible",
  "frustrated",
  "frustrating",
  "switched from",
  "alternative to",
  "alternatives to",
  "looking for alternative",
  "moved away",
  "moved from",
  "switching from",
  "expensive",
  "too expensive",
  "overpriced",
  "pricing is",
  "latency",
  "high latency",
  "slow",
  "buggy",
  "unreliable",
  "bad support",
  "poor support",
  "no support",
  "customer service",
  "downtime",
  "outage",
  "disappointed",
  "worst",
  "hate",
  "avoid",
  "scam",
  "complaint",
  "issue with",
  "problem with",
  "vs ",
  " vs.",
  "better than",
  "worse than",
  "compared to",
  "comparison",
];

export const LEAD_SIGNAL_KEYWORDS = [
  "launches",
  "deploys",
  "adopts",
  "partners with",
  "integrates",
  "announces",
  "unveils",
  "introduces",
  "rolls out",
  "implements",
  "building",
  "built with",
  "powered by",
  "using ai",
  "ai-powered",
  "automate calls",
  "automate customer",
  "replace ivr",
  "ai receptionist",
  "ai phone",
  "voice bot",
];

// Junk content filters — articles matching these are noise, not intelligence
export const JUNK_TITLE_PATTERNS = [
  /\b(job|hiring|resume|career|salary|internship)\b/i,
  /\b(meme|stolen|lost my|found my)\b/i,
  /\b(book review|movie review|game review)\b/i,
  /\b(horoscope|recipe|workout|diet)\b/i,
  /\bmy (psychiatrist|therapist|doctor|dentist)\b/i,
  /\b(fanfic|fan fiction|roleplay)\b/i,
  /\bexit strategy\b/i, // TV show, not business
  /\bstock (price|alert|buy|sell)\b/i,
];

// Detect the signal type for an article
export function detectSignalType(
  title: string,
  summary: string,
  sourceTag?: string
): { signalType: SignalType; signalLabel: string; competitorName?: string } {
  const text = `${title} ${summary}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // Check for competitor mentions
  let competitorName: string | undefined;
  for (const [key, displayName] of Object.entries(COMPETITOR_DISPLAY_NAMES)) {
    if (text.includes(key)) {
      competitorName = displayName;
      break;
    }
  }

  // Pain point detection (highest priority for community posts)
  if (sourceTag === "community") {
    const hasPainPoint = PAIN_POINT_KEYWORDS.some((kw) => text.includes(kw));
    if (hasPainPoint && competitorName) {
      return {
        signalType: "pain-point",
        signalLabel: `${competitorName} — User Complaint`,
        competitorName,
      };
    }
    if (hasPainPoint) {
      return {
        signalType: "pain-point",
        signalLabel: "User Pain Point",
      };
    }
  }

  // Competitor moves
  if (sourceTag === "competitor" || competitorName) {
    return {
      signalType: "competitor-move",
      signalLabel: competitorName
        ? `${competitorName} — News`
        : "Competitor Activity",
      competitorName,
    };
  }

  // Lead signals
  if (sourceTag === "lead") {
    const hasLeadKeyword = LEAD_SIGNAL_KEYWORDS.some((kw) =>
      titleLower.includes(kw)
    );
    if (hasLeadKeyword) {
      return {
        signalType: "lead-signal",
        signalLabel: "Potential Customer",
      };
    }
    return {
      signalType: "lead-signal",
      signalLabel: "Market Signal",
    };
  }

  // Community discussions
  if (sourceTag === "community") {
    return {
      signalType: "community",
      signalLabel: "Community Discussion",
    };
  }

  // Default to market news
  return {
    signalType: "market-news",
    signalLabel: "Industry News",
  };
}

// ─── Lead relevance filter — only keep articles about companies actually deploying voice AI ──
const LEAD_MUST_TERMS = [
  "voice ai", "voice agent", "ai voice", "voice bot", "voicebot",
  "ai receptionist", "virtual receptionist", "ai phone", "ai calling",
  "call center ai", "contact center ai", "text to speech", "speech synthesis",
  "voice cloning", "conversational ai", "telephony ai", "voice api",
  "voice platform", "ai front desk", "automated calls", "ivr",
  "voice assistant", "ai call", "ai-powered call", "ai-powered voice",
];

const LEAD_NOISE_PATTERNS = [
  /\bdata center\b/i,
  /\b(country|countries|nation|government)\b.*\b(brace|prepare|ready|future)\b/i,
  /\bindustry (report|forecast|outlook|trends|braces|prepares)\b/i,
  /\b(stock|share|equity) (price|alert|buy|sell|market)\b/i,
  /\b(quarterly|annual) (earnings|results|revenue)\b/i,
  /\bsecurity (platform|operations|monitoring)\b/i,
  /\bgpu|semiconductor|chip (fab|manufacturing)\b/i,
  /\bmarket (share|size|growth|analysis|report|forecast|research)\b/i,
  /\b(opportunities|trends|outlook)\s+\d{4}/i,
];

export function isRelevantLead(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();

  // Must mention voice AI specifically — not just generic "AI"
  const hasVoiceAI = LEAD_MUST_TERMS.some((term) => text.includes(term));
  if (!hasVoiceAI) return false;

  // Filter out noise patterns
  const fullText = `${title} ${summary}`;
  for (const pattern of LEAD_NOISE_PATTERNS) {
    if (pattern.test(fullText)) return false;
  }

  return true;
}

// Check if an article is junk that should be filtered out
export function isJunkArticle(title: string, summary: string): boolean {
  for (const pattern of JUNK_TITLE_PATTERNS) {
    if (pattern.test(title)) return true;
  }

  // If the summary is just repeating the title + source name, it's low-quality Google News
  // But we still keep it — just note it has no real summary
  return false;
}

// For articles from competitor sources, detect which competitor
export function detectCompetitorFromSlug(slug: string): string | undefined {
  if (slug.includes("vapi")) return "Vapi";
  if (slug.includes("retell")) return "Retell AI";
  if (slug.includes("elevenlabs")) return "ElevenLabs";
  if (slug.includes("blandai")) return "Bland AI";
  if (slug.includes("synthflow")) return "Synthflow";
  return undefined;
}
