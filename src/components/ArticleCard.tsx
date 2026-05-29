"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ArrowRight } from "lucide-react";
import type { Article } from "@/types";
import { CATEGORY_LABELS } from "@/lib/keywords";

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
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-gray-50 border-gray-900 ring-1 ring-gray-900/5"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {/* Source + time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] text-gray-500 font-medium">
          {article.source}
        </span>
        <span className="text-[12px] text-gray-300">&middot;</span>
        <span className="text-[12px] text-gray-400">{timeAgo}</span>
        <div className="flex-1" />
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
          {CATEGORY_LABELS[article.category] || article.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-semibold leading-snug text-gray-900 mb-1.5 group-hover:text-black transition-colors">
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end pt-2 mt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <ArrowRight
            className={`w-3.5 h-3.5 transition-all ${
              isSelected
                ? "text-gray-900 translate-x-0.5"
                : "text-gray-300 group-hover:text-gray-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
