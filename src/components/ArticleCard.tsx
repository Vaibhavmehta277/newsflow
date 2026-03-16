"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ChevronRight } from "lucide-react";
import type { Article } from "@/types";
import { CATEGORY_META } from "@/lib/keywords";

interface ArticleCardProps {
  article: Article;
  isSelected: boolean;
  onClick: () => void;
}

export default function ArticleCard({
  article,
  isSelected,
  onClick,
}: ArticleCardProps) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META["ai-news"];
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 rounded-[6px] border cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-[var(--bg-elevated)] border-[var(--accent-border)] ring-1 ring-[var(--accent-border)]"
          : "bg-[var(--bg-surface)] border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--border)]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor}`} />
          <span className="text-[11px] text-[var(--text-muted)] truncate font-medium">
            {article.source}
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">·</span>
          <span className="text-[11px] text-[var(--text-muted)]">{timeAgo}</span>
        </div>
        <span
          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-[4px] border font-medium ${meta.bgColor}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-sm font-medium leading-snug mb-2 transition-colors ${
          isSelected ? "text-white" : "text-[var(--text-primary)] group-hover:text-white"
        }`}
      >
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3">
          {article.summary}
        </p>
      )}

      {/* Keywords + actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {article.keywords.slice(0, 3).map((kw) => (
            <span
              key={kw}
              className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
            >
              {kw}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-all ${
              isSelected
                ? "text-[var(--accent)] translate-x-0.5"
                : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
