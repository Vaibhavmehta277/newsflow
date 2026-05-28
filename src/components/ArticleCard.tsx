"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import type { Article } from "@/types";

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
      className={`group relative p-4 rounded-xl border cursor-pointer transition-colors ${
        isSelected
          ? "bg-gray-50 border-gray-300"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] text-gray-500 font-medium">
          {article.source}
        </span>
        <span className="text-[12px] text-gray-300">&middot;</span>
        <span className="text-[12px] text-gray-400">{timeAgo}</span>
        <div className="flex-1" />
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
          {article.category.replace("-", " ")}
        </span>
      </div>

      <h3 className="text-[14px] font-medium leading-snug text-gray-900 mb-1.5">
        {article.title}
      </h3>

      {article.summary && (
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {article.summary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {article.keywords.slice(0, 3).map((kw) => (
            <span
              key={kw}
              className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500"
            >
              {kw}
            </span>
          ))}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
