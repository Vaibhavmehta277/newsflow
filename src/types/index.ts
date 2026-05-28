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
