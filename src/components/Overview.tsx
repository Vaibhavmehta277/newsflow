"use client";

import { useMemo } from "react";
import {
  Zap,
  Eye,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Article, SheetRow, Section } from "@/types";
import { COMPETITOR_NAMES } from "@/lib/keywords";

interface OverviewProps {
  articles: Article[];
  sheetRows: SheetRow[];
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
  value: number | string;
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

function ArticleRow({
  article,
  onClick,
  showSignal,
}: {
  article: Article;
  onClick: () => void;
  showSignal?: boolean;
}) {
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  const signalColors: Record<string, string> = {
    "pain-point": "bg-red-50 text-red-600 border-red-100",
    "competitor-move": "bg-purple-50 text-purple-600 border-purple-100",
    "lead-signal": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "market-news": "bg-blue-50 text-blue-600 border-blue-100",
    community: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        {showSignal && article.signalType && (
          <span
            className={`inline-block text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide mb-1.5 ${signalColors[article.signalType] || ""}`}
          >
            {article.signalType === "pain-point"
              ? "Pain Point"
              : article.signalType === "competitor-move"
                ? "Competitor"
                : article.signalType === "lead-signal"
                  ? "Lead"
                  : "Market"}
          </span>
        )}
        <p className="text-[13px] text-gray-800 font-medium leading-snug line-clamp-2 group-hover:text-gray-900">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {article.competitorName && (
            <>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
                {article.competitorName}
              </span>
            </>
          )}
          <span className="text-[11px] text-gray-400">{article.source}</span>
          <span className="text-[11px] text-gray-300">&middot;</span>
          <span className="text-[11px] text-gray-400">{timeAgo}</span>
        </div>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
    </button>
  );
}

export default function Overview({
  articles,
  sheetRows,
  onNavigate,
  onSelectArticle,
}: OverviewProps) {
  const leadAlerts = useMemo(() => {
    return articles.filter((a) => a.sourceTag === "lead");
  }, [articles]);

  const competitorArticles = useMemo(() => {
    return articles.filter((a) => {
      if (a.sourceTag === "competitor") return true;
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return COMPETITOR_NAMES.some((name) => text.includes(name));
    });
  }, [articles]);

  const painPoints = useMemo(() => {
    return articles.filter((a) => a.signalType === "pain-point");
  }, [articles]);

  const communityPosts = useMemo(() => {
    return articles.filter((a) => a.sourceTag === "community");
  }, [articles]);

  // Priority items: pain points first, then competitor moves, then leads
  const priorityItems = useMemo(() => {
    const items: Article[] = [];
    // Pain points are gold — competitor weaknesses you can exploit
    items.push(...painPoints);
    // Fresh competitor moves
    items.push(
      ...competitorArticles
        .filter((a) => !items.find((i) => i.id === a.id))
        .slice(0, 3)
    );
    // Top leads
    items.push(
      ...leadAlerts
        .filter((a) => !items.find((i) => i.id === a.id))
        .slice(0, 3)
    );
    return items.slice(0, 8);
  }, [painPoints, competitorArticles, leadAlerts]);

  return (
    <div className="p-6 max-w-[1100px] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Intelligence Overview
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Voice AI market signals from the last 7 days
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Lead Signals"
          value={leadAlerts.length}
          icon={Zap}
          color="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigate("lead-alerts")}
        />
        <StatCard
          label="Competitor Moves"
          value={competitorArticles.length}
          icon={Eye}
          color="bg-purple-50 text-purple-600"
          onClick={() => onNavigate("competitor-watch")}
        />
        <StatCard
          label="Pain Points"
          value={painPoints.length}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
          onClick={() => onNavigate("reddit")}
        />
        <StatCard
          label="Community Posts"
          value={communityPosts.length}
          icon={MessageCircle}
          color="bg-amber-50 text-amber-600"
          onClick={() => onNavigate("reddit")}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Priority Intelligence — takes 3 cols */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900">
                Priority Intelligence
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Pain points, competitor moves, and leads — act on these first
              </p>
            </div>
            <button
              onClick={() => onNavigate("feed")}
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          {priorityItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-gray-500">
                No priority items yet. Click Refresh to fetch latest data.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {priorityItems.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onClick={() => onSelectArticle(article)}
                  showSignal
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar — takes 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lead signals */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                Fresh Leads
              </h3>
              <button
                onClick={() => onNavigate("lead-alerts")}
                className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                View all ({leadAlerts.length})
              </button>
            </div>
            {leadAlerts.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">
                No lead signals in the last 7 days
              </p>
            ) : (
              <div className="space-y-2">
                {leadAlerts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArticle(a)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-[12px] text-gray-700 font-medium leading-snug line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {a.source} &middot;{" "}
                      {formatDistanceToNow(new Date(a.publishedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Competitor watch */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-purple-500" />
                Competitor Watch
              </h3>
              <button
                onClick={() => onNavigate("competitor-watch")}
                className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                View all ({competitorArticles.length})
              </button>
            </div>
            {competitorArticles.length === 0 ? (
              <p className="text-[12px] text-gray-400 py-4 text-center">
                No competitor news in the last 7 days
              </p>
            ) : (
              <div className="space-y-2">
                {competitorArticles.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArticle(a)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {a.competitorName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
                        {a.competitorName}
                      </span>
                    )}
                    <p className="text-[12px] text-gray-700 font-medium leading-snug line-clamp-2 mt-1">
                      {a.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pain Points — if any exist */}
          {painPoints.length > 0 && (
            <div className="bg-white border border-red-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Pain Points
                </h3>
                <button
                  onClick={() => onNavigate("reddit")}
                  className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  View all
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">
                Competitor weaknesses and user complaints — opportunities for
                Smallest AI
              </p>
              <div className="space-y-2">
                {painPoints.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelectArticle(a)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-red-50/50 transition-colors"
                  >
                    {a.competitorName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                        {a.competitorName}
                      </span>
                    )}
                    <p className="text-[12px] text-gray-700 font-medium leading-snug line-clamp-2 mt-1">
                      {a.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
