"use client";

import {
  X,
  ExternalLink,
  ArrowUp,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import type { Article, SignalType } from "@/types";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
}

const SIGNAL_CONTEXT: Record<
  SignalType,
  { label: string; description: string; color: string }
> = {
  "pain-point": {
    label: "Competitor Weakness",
    description:
      "Users are frustrated — this is an opportunity for Smallest AI to win them over with a better product.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  "competitor-move": {
    label: "Competitor Move",
    description:
      "A competitor made a move (launch, partnership, funding). Evaluate if this changes your positioning.",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  "lead-signal": {
    label: "Potential Lead",
    description:
      "This company is deploying or looking for voice AI solutions. Potential customer for Smallest AI.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  "market-news": {
    label: "Market Intelligence",
    description:
      "Voice AI industry development. Useful for strategy and understanding market direction.",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  community: {
    label: "Community Discussion",
    description:
      "The voice AI community is discussing this. Useful for understanding user sentiment and market pulse.",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
};

export default function ArticleDetail({
  article,
  onClose,
}: ArticleDetailProps) {
  const signal = article.signalType
    ? SIGNAL_CONTEXT[article.signalType]
    : SIGNAL_CONTEXT["market-news"];

  const isReddit = article.redditScore !== undefined;

  return (
    <aside className="w-[380px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {article.signalType && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${signal.color}`}
                >
                  {article.signalType === "pain-point"
                    ? "PAIN POINT"
                    : article.signalType === "competitor-move"
                      ? "COMPETITOR"
                      : article.signalType === "lead-signal"
                        ? "LEAD"
                        : article.signalType === "community"
                          ? "COMMUNITY"
                          : "MARKET"}
                </span>
              )}
              {article.competitorName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
                  {article.competitorName}
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {format(new Date(article.publishedAt), "MMM d, yyyy")}
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug">
              {article.title}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">{article.source}</p>

            {/* Reddit stats */}
            {isReddit && (
              <div className="flex items-center gap-3 mt-2">
                {article.redditScore !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <ArrowUp className="w-3 h-3" />
                    {article.redditScore} upvotes
                  </span>
                )}
                {article.redditComments !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MessageSquare className="w-3 h-3" />
                    {article.redditComments} comments
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5">
        {/* Summary */}
        {article.summary && article.summary.length > 20 && (
          <div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Read full article */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] text-gray-900 font-medium hover:underline"
        >
          Read full article
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Why this matters */}
        <div className={`rounded-lg p-4 border ${signal.color}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">
            Why this matters
          </p>
          <p className="text-[13px] font-semibold">{signal.label}</p>
          <p className="text-[12px] mt-1 opacity-80 leading-relaxed">
            {signal.description}
          </p>
        </div>
      </div>
    </aside>
  );
}
