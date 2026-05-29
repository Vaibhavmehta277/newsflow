"use client";

import {
  Zap,
  Eye,
  AlertTriangle,
  MessageCircle,
  Newspaper,
  Play,
  ArrowUpRight,
  ArrowUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Article, Section } from "@/types";

interface OverviewProps {
  painPoints: Article[];
  leadAlerts: Article[];
  competitorArticles: Article[];
  redditArticles: Article[];
  youtubeArticles: Article[];
  feedArticles: Article[];
  onNavigate: (section: Section) => void;
  onSelectArticle: (article: Article) => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left w-full group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {onClick && (
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">
        {value}
      </p>
      <p className="text-[12px] text-gray-500 mt-0.5">{label}</p>
    </button>
  );
}

function CompactRow({
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
      className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      {article.competitorName && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium mr-1.5">
          {article.competitorName}
        </span>
      )}
      <p className="text-[12px] text-gray-700 font-medium leading-snug line-clamp-2 mt-0.5">
        {article.title}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[11px] text-gray-400">{article.source}</span>
        <span className="text-[11px] text-gray-300">|</span>
        <span className="text-[11px] text-gray-400">{timeAgo}</span>
        {article.redditScore !== undefined && (
          <>
            <span className="text-[11px] text-gray-300">|</span>
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <ArrowUp className="w-2.5 h-2.5" />
              {article.redditScore}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export default function Overview({
  painPoints,
  leadAlerts,
  competitorArticles,
  redditArticles,
  youtubeArticles,
  feedArticles,
  onNavigate,
  onSelectArticle,
}: OverviewProps) {
  const total =
    painPoints.length +
    leadAlerts.length +
    competitorArticles.length +
    redditArticles.length +
    youtubeArticles.length +
    feedArticles.length;

  return (
    <div className="p-6 max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Intelligence Overview
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {total} signals from the last 7 days — each article appears in
          exactly one section
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard
          label="Pain Points"
          value={painPoints.length}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          onClick={() => onNavigate("pain-points")}
        />
        <StatCard
          label="Leads"
          value={leadAlerts.length}
          icon={Zap}
          color="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigate("lead-alerts")}
        />
        <StatCard
          label="Competitor"
          value={competitorArticles.length}
          icon={Eye}
          color="bg-purple-50 text-purple-600"
          onClick={() => onNavigate("competitor-watch")}
        />
        <StatCard
          label="Reddit"
          value={redditArticles.length}
          icon={MessageCircle}
          color="bg-amber-50 text-amber-600"
          onClick={() => onNavigate("reddit")}
        />
        <StatCard
          label="YouTube"
          value={youtubeArticles.length}
          icon={Play}
          color="bg-red-50 text-red-600"
          onClick={() => onNavigate("youtube")}
        />
        <StatCard
          label="Industry"
          value={feedArticles.length}
          icon={Newspaper}
          color="bg-blue-50 text-blue-600"
          onClick={() => onNavigate("feed")}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pain Points */}
        <div
          className={`bg-white border rounded-xl p-5 ${painPoints.length > 0 ? "border-red-200" : "border-gray-200"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Pain Points
            </h3>
            {painPoints.length > 0 && (
              <button
                onClick={() => onNavigate("pain-points")}
                className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
              >
                View all ({painPoints.length})
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mb-3">
            Competitor weaknesses and user frustrations — act on these
          </p>
          {painPoints.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">
              No pain points detected this week
            </p>
          ) : (
            <div className="space-y-1">
              {painPoints.slice(0, 4).map((a) => (
                <CompactRow
                  key={a.id}
                  article={a}
                  onClick={() => onSelectArticle(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Competitor Intel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-purple-500" />
              Competitor Intel
            </h3>
            <button
              onClick={() => onNavigate("competitor-watch")}
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
            >
              View all ({competitorArticles.length})
            </button>
          </div>
          {competitorArticles.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">
              No competitor news this week
            </p>
          ) : (
            <div className="space-y-1">
              {competitorArticles.slice(0, 4).map((a) => (
                <CompactRow
                  key={a.id}
                  article={a}
                  onClick={() => onSelectArticle(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lead Alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Lead Alerts
            </h3>
            <button
              onClick={() => onNavigate("lead-alerts")}
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
            >
              View all ({leadAlerts.length})
            </button>
          </div>
          {leadAlerts.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">
              No leads this week
            </p>
          ) : (
            <div className="space-y-1">
              {leadAlerts.slice(0, 4).map((a) => (
                <CompactRow
                  key={a.id}
                  article={a}
                  onClick={() => onSelectArticle(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reddit */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
              Reddit
            </h3>
            <button
              onClick={() => onNavigate("reddit")}
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
            >
              View all ({redditArticles.length})
            </button>
          </div>
          {redditArticles.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">
              No community posts this week
            </p>
          ) : (
            <div className="space-y-1">
              {redditArticles.slice(0, 4).map((a) => (
                <CompactRow
                  key={a.id}
                  article={a}
                  onClick={() => onSelectArticle(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* YouTube */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-red-500" />
              YouTube
            </h3>
            <button
              onClick={() => onNavigate("youtube")}
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
            >
              View all ({youtubeArticles.length})
            </button>
          </div>
          {youtubeArticles.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">
              No videos this week
            </p>
          ) : (
            <div className="space-y-1">
              {youtubeArticles.slice(0, 4).map((a) => (
                <CompactRow
                  key={a.id}
                  article={a}
                  onClick={() => onSelectArticle(a)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
