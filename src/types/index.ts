export type ArticleCategory =
  | "voice-ai"
  | "use-case"
  | "market-intel"
  | "cx"
  | "ai-news";

export interface Article {
  id: string;
  title: string;
  source: string;
  sourceSlug: string;
  url: string;
  publishedAt: string;
  summary: string;
  keywords: string[];
  category: ArticleCategory;
  imageUrl?: string;
  isLocked?: boolean;
  lockedBy?: string;
}

export interface Caption {
  platform: "linkedin" | "twitter" | "instagram";
  content: string;
}

export interface Draft {
  id: string;
  articleId: string;
  article: Article;
  comment: string;
  captions: Partial<Record<"linkedin" | "twitter" | "instagram", string>>;
  assignedTo: string;
  assignedToEmail: string;
  status: "saved" | "posted" | "skipped";
  platform?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SheetRow {
  date: string;
  title: string;
  source: string;
  url: string;
  keywordTag: string;
  assignedTo: string;
  status: string;
  platform: string;
  caption: string;
  postedBy: string;
}

export interface RSSSource {
  name: string;
  slug: string;
  url: string;
  priority: "high" | "medium";
  category: ArticleCategory;
}

export interface KeywordGroup {
  label: string;
  category: ArticleCategory;
  keywords: string[];
  color: string;
  bgColor: string;
}

export interface VideoItem {
  id: string;           // YouTube video ID
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;  // ISO 8601
  thumbnailUrl: string;
  description: string;  // First 300 chars of video description
  viewCount: number;
  likeCount?: number;
  url: string;          // https://youtube.com/watch?v=ID
  searchKeyword: string; // Which keyword surfaced this video
}

// ── Feature 1: Competitor Intelligence ──────────────────────────────────────

export interface IntelItem {
  id: string;
  competitor: string;              // Primary competitor name
  mentionedCompetitors: string[];  // All competitors mentioned
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  opportunityNote: string;         // AI-generated sales opportunity note
  score: number;                   // 1–10
  tier: "hot" | "warm" | "watching"; // 8-10 | 5-7 | 1-4
  platform: "reddit" | "rss" | "hn" | "github" | "producthunt";
}

// ── Feature 2: Lead Trigger Alerts ──────────────────────────────────────────

export type LeadTriggerCategory =
  | "pain-point"
  | "solution-seeking"
  | "competitor-comparison"
  | "industry-specific";

export interface LeadItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  triggerPhrases: string[];
  triggerCategory: LeadTriggerCategory;
  outreachDraft: string;           // AI-generated personalized outreach
  score: number;                   // 1–10
  platform: "reddit" | "rss" | "youtube" | "hn" | "github" | "producthunt";
}

// ── Feature 3: Weekly Newsletter ─────────────────────────────────────────────

export interface NewsletterArticle {
  title: string;
  source: string;
  url: string;
  summary: string;
}

export interface NewsletterVideo {
  title: string;
  channel: string;
  url: string;
  summary: string;
}

export interface NewsletterCompetitorWatch {
  competitor: string;
  insight: string;
  opportunity: string;
}

export interface Newsletter {
  id: string;
  generatedAt: string;
  weekOf: string;
  subject: string;
  previewText: string;
  intro: string;
  articles: NewsletterArticle[];
  videos: NewsletterVideo[];
  competitorWatch: NewsletterCompetitorWatch[];
  marketSignal: string;
  cta: string;
  htmlContent: string;
  plainText: string;
}
