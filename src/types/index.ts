export type ArticleCategory =
  | "voice-ai"
  | "use-case"
  | "market-intel"
  | "cx"
  | "ai-news";

export type Section =
  | "overview"
  | "feed"
  | "lead-alerts"
  | "competitor-watch"
  | "reddit"
  | "youtube"
  | "blogs"
  | "edits";

export type SourceTag = "competitor" | "lead" | "industry" | "community";

export type SignalType =
  | "pain-point"
  | "competitor-move"
  | "lead-signal"
  | "market-news"
  | "community";

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
  sourceTag?: SourceTag;
  signalType?: SignalType;
  signalLabel?: string; // e.g. "ElevenLabs", "Vapi", "Customer Complaint"
  competitorName?: string; // which competitor this is about
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
  tag: SourceTag;
}

export interface KeywordGroup {
  label: string;
  category: ArticleCategory;
  keywords: string[];
}
