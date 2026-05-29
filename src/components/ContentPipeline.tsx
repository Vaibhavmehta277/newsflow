"use client";

import {
  Play,
  PenLine,
  FileEdit,
  ExternalLink,
  Clock,
  Inbox,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Article, SheetRow } from "@/types";

interface ContentPipelineProps {
  rows: SheetRow[];
  type: "youtube" | "blogs" | "edits";
  loading: boolean;
  suggestions?: Article[];
  onSelectArticle?: (article: Article) => void;
}

const CONFIG = {
  youtube: {
    title: "YouTube",
    subtitle: "Video content pipeline",
    icon: Play,
    emptyTitle: "No saved YouTube content yet",
    suggestTitle: "Suggested for YouTube",
    suggestSubtitle:
      "Trending topics, competitor moves, and product launches — great for video content",
  },
  blogs: {
    title: "Blogs",
    subtitle: "Blog content pipeline",
    icon: PenLine,
    emptyTitle: "No saved blog content yet",
    suggestTitle: "Suggested for Blog",
    suggestSubtitle:
      "Industry trends, use cases, and deep analysis — great for thought leadership posts",
  },
  edits: {
    title: "Edits",
    subtitle: "Saved articles waiting for review",
    icon: FileEdit,
    emptyTitle: "No saved articles yet",
    suggestTitle: "",
    suggestSubtitle: "",
  },
};

function SuggestionCard({
  article,
  onClick,
}: {
  article: Article;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] text-gray-500">{article.source}</span>
            <span className="text-[12px] text-gray-300">&middot;</span>
            <span className="text-[12px] text-gray-400">{timeAgo}</span>
          </div>
          <h3 className="text-[14px] font-medium text-gray-900 leading-snug group-hover:text-black">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mt-1.5">
              {article.summary}
            </p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  );
}

export default function ContentPipeline({
  rows,
  type,
  loading,
  suggestions = [],
  onSelectArticle,
}: ContentPipelineProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="p-6 max-w-[900px]">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-48 bg-gray-50 rounded animate-pulse mt-2" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasSavedItems = rows.length > 0;
  const hasSuggestions = suggestions.length > 0 && type !== "edits";

  return (
    <div className="p-6 max-w-[900px] space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {config.title}
          </h1>
          <p className="text-[13px] text-gray-500">{config.subtitle}</p>
        </div>
      </div>

      {/* Saved items from sheets */}
      {hasSavedItems && (
        <div>
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Saved ({rows.length})
          </p>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-medium text-gray-900 leading-snug">
                      {row.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[12px] text-gray-500">
                        {row.source}
                      </span>
                      {row.assignedTo && (
                        <>
                          <span className="text-[12px] text-gray-300">
                            &middot;
                          </span>
                          <span className="text-[12px] text-gray-500">
                            {row.assignedTo}
                          </span>
                        </>
                      )}
                      <span className="text-[12px] text-gray-300">
                        &middot;
                      </span>
                      <span className="flex items-center gap-1 text-[12px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {row.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        row.status === "posted"
                          ? "text-green-700 bg-green-50"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-gray-500 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions from feed */}
      {hasSuggestions && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
              {config.suggestTitle}
            </p>
          </div>
          <p className="text-[12px] text-gray-400 mb-4">
            {config.suggestSubtitle}
          </p>
          <div className="space-y-2">
            {suggestions.map((article) => (
              <SuggestionCard
                key={article.id}
                article={article}
                onClick={() => onSelectArticle?.(article)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when nothing at all */}
      {!hasSavedItems && !hasSuggestions && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div className="p-3 rounded-full bg-gray-50 mb-3">
            <Inbox className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-[14px] font-medium text-gray-700 mb-1">
            {config.emptyTitle}
          </p>
          <p className="text-[13px] text-gray-400 max-w-sm text-center">
            Browse the Feed and save articles here using the detail panel.
          </p>
        </div>
      )}
    </div>
  );
}
