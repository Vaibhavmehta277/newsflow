"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ArrowUp, MessageSquare, Eye, Clock, Play } from "lucide-react";
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
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "PAIN POINT",
  },
  "competitor-move": {
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    label: "COMPETITOR",
  },
  "lead-signal": {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    label: "LEAD",
  },
  "market-news": {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    label: "MARKET",
  },
  community: {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-600",
    label: "COMMUNITY",
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

  const isReddit =
    article.redditScore !== undefined || article.subreddit !== undefined;
  const isYouTube = !!article.videoId;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatViews = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-gray-50 border-gray-900 ring-1 ring-gray-900/5"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {/* YouTube thumbnail */}
      {isYouTube && article.videoId && (
        <div className="relative rounded-lg overflow-hidden mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${article.videoId}/mqdefault.jpg`}
            alt=""
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
          {article.duration !== undefined && (
            <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded font-medium">
              {formatDuration(article.duration)}
            </span>
          )}
        </div>
      )}

      {/* Top row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {isYouTube ? (
          <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider bg-red-50 border-red-200 text-red-700">
            YOUTUBE
          </span>
        ) : (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded border font-bold tracking-wider ${signal.bg} ${signal.text}`}
          >
            {signal.label}
          </span>
        )}
        {article.competitorName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
            {article.competitorName}
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[11px] text-gray-400">{article.source}</span>
        <span className="text-[11px] text-gray-300">|</span>
        <span className="text-[11px] text-gray-400">{timeAgo}</span>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-semibold leading-snug text-gray-900 mb-1 group-hover:text-black">
        {article.title}
      </h3>

      {/* Summary — only show if it adds value beyond the title */}
      {!isYouTube && article.summary && article.summary.length > 20 && (
        <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2 mb-2">
          {article.summary}
        </p>
      )}

      {/* Reddit engagement stats */}
      {isReddit && (
        <div className="flex items-center gap-3 mt-1.5">
          {article.redditScore !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <ArrowUp className="w-3 h-3" />
              {article.redditScore}
            </span>
          )}
          {article.redditComments !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <MessageSquare className="w-3 h-3" />
              {article.redditComments}
            </span>
          )}
        </div>
      )}

      {/* YouTube stats */}
      {isYouTube && (
        <div className="flex items-center gap-3 mt-1.5">
          {article.viewCount !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Eye className="w-3 h-3" />
              {formatViews(article.viewCount)} views
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end pt-2 mt-1 border-t border-gray-100">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
