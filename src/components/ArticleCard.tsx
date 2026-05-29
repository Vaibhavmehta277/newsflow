"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ArrowRight } from "lucide-react";
import type { Article, SignalType } from "@/types";

interface ArticleCardProps {
  article: Article;
  isSelected: boolean;
  onClick: () => void;
}

const SIGNAL_STYLES: Record<
  SignalType,
  { bg: string; text: string; label: string }
> = {
  "pain-point": {
    bg: "bg-red-50 border-red-100",
    text: "text-red-700",
    label: "Pain Point",
  },
  "competitor-move": {
    bg: "bg-purple-50 border-purple-100",
    text: "text-purple-700",
    label: "Competitor",
  },
  "lead-signal": {
    bg: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-700",
    label: "Lead Signal",
  },
  "market-news": {
    bg: "bg-blue-50 border-blue-100",
    text: "text-blue-700",
    label: "Market",
  },
  community: {
    bg: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
    label: "Community",
  },
};

export default function ArticleCard({
  article,
  isSelected,
  onClick,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  const signal = article.signalType
    ? SIGNAL_STYLES[article.signalType]
    : SIGNAL_STYLES["market-news"];

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-gray-50 border-gray-900 ring-1 ring-gray-900/5"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {/* Top row: signal badge + competitor name + source + time */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${signal.bg} ${signal.text}`}
        >
          {signal.label}
        </span>
        {article.competitorName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
            {article.competitorName}
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[11px] text-gray-400">
          {article.source}
        </span>
        <span className="text-[11px] text-gray-300">&middot;</span>
        <span className="text-[11px] text-gray-400">{timeAgo}</span>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-semibold leading-snug text-gray-900 mb-1 group-hover:text-black transition-colors">
        {article.title}
      </h3>

      {/* Signal label — why this matters */}
      {article.signalLabel && (
        <p className="text-[12px] text-gray-500 mb-1.5 font-medium">
          {article.signalLabel}
        </p>
      )}

      {/* Summary */}
      {article.summary && (
        <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2">
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
