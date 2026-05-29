"use client";

import {
  X,
  ExternalLink,
  ArrowUp,
  MessageSquare,
  Eye,
  Clock,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import type { Article, SignalType } from "@/types";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
}

const SIGNAL_BADGE: Record<SignalType, { label: string; color: string }> = {
  "pain-point": {
    label: "PAIN POINT",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  "competitor-move": {
    label: "COMPETITOR",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  "lead-signal": {
    label: "LEAD",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  "market-news": {
    label: "MARKET",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  community: {
    label: "COMMUNITY",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function ArticleDetail({
  article,
  onClose,
}: ArticleDetailProps) {
  const badge = article.signalType
    ? SIGNAL_BADGE[article.signalType]
    : SIGNAL_BADGE["market-news"];

  const isReddit = article.redditScore !== undefined;
  const isYouTube = !!article.videoId;

  return (
    <aside className="w-[380px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {article.signalType && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${badge.color}`}
                >
                  {badge.label}
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

            {/* YouTube stats */}
            {isYouTube && (
              <div className="flex items-center gap-3 mt-2">
                {article.viewCount !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Eye className="w-3 h-3" />
                    {formatViews(article.viewCount)} views
                  </span>
                )}
                {article.duration !== undefined && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDuration(article.duration)}
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
        {/* YouTube thumbnail + play */}
        {isYouTube && article.videoId && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative rounded-lg overflow-hidden group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${article.videoId}/mqdefault.jpg`}
              alt={article.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          </a>
        )}

        {/* Summary */}
        {article.summary && article.summary.length > 20 && (
          <div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Read full article / Watch video */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[13px] text-gray-900 font-medium hover:underline"
        >
          {isYouTube ? "Watch on YouTube" : "Read full article"}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
}
