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
  | "youtube"
  | "blogs"
  | "edits";

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
}
