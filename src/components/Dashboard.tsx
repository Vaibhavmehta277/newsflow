"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow, isToday } from "date-fns";
import type { IntelItem, EngageItem } from "@/types";

const PLATFORM_LABEL: Record<string, string> = {
  reddit: "Reddit",
  hn: "Hacker News",
  producthunt: "Product Hunt",
  rss: "RSS",
};

const TIER_COLOR: Record<string, string> = {
  hot: "text-[var(--red)]",
  warm: "text-[var(--amber)]",
  watching: "text-[var(--text-muted)]",
};

interface BriefingData {
  articlesTotal: number;
  hotIntel: number;
  leadCount: number;
  engageCount: number;
  topStory: IntelItem | null;
  bestEngage: EngageItem | null;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent?: "red" | "amber" | "green" | "accent";
}) {
  const valueColor =
    accent === "red"
      ? "text-[var(--red)]"
      : accent === "amber"
      ? "text-[var(--amber)]"
      : accent === "green"
      ? "text-[var(--green)]"
      : "text-[var(--accent)]";

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-2">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [feedsRes, intelRes, leadsRes, engageRes] = await Promise.allSettled([
        fetch("/api/feeds?limit=200"),
        fetch("/api/intel"),
        fetch("/api/leads"),
        fetch("/api/engage"),
      ]);

      const safeJson = async (r: PromiseSettledResult<Response>) => {
        if (r.status !== "fulfilled" || !r.value.ok) return null;
        try {
          return await r.value.json();
        } catch {
          return null;
        }
      };

      const [feedsData, intelData, leadsData, engageData] = await Promise.all([
        safeJson(feedsRes),
        safeJson(intelRes),
        safeJson(leadsRes),
        safeJson(engageRes),
      ]);

      const articles: { publishedAt: string }[] = feedsData?.articles ?? [];
      const todayCount = articles.filter((a) => isToday(new Date(a.publishedAt))).length;

      const intelItems: IntelItem[] = intelData?.items ?? [];
      const engageItems: EngageItem[] = engageData?.items ?? [];
      const leadItems: unknown[] = leadsData?.items ?? [];

      setData({
        articlesTotal: todayCount,
        hotIntel: intelData?.hot ?? 0,
        leadCount: leadItems.length,
        engageCount: engageItems.length,
        topStory: intelItems[0] ?? null,
        bestEngage: engageItems[0] ?? null,
      });
    } catch {
      setError("Failed to load briefing data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-[var(--bg-elevated)] rounded-[4px] w-36" />
          <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-52" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4 space-y-3"
            >
              <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-20" />
              <div className="h-6 bg-[var(--bg-elevated)] rounded-[4px] w-10" />
              <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4 space-y-3"
            >
              <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-32" />
              <div className="h-4 bg-[var(--bg-elevated)] rounded-[4px] w-3/4" />
              <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
              <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Morning Briefing
          </h1>
          <p className="text-[11px] text-[var(--text-muted)]">{dateStr}</p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="h-[30px] px-3 rounded-[4px] text-[13px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Articles today"
          value={data?.articlesTotal ?? 0}
          sub="in feed"
          accent="accent"
        />
        <StatCard
          label="Hot intel"
          value={data?.hotIntel ?? 0}
          sub="signals"
          accent="red"
        />
        <StatCard
          label="Active leads"
          value={data?.leadCount ?? 0}
          sub="alerts"
          accent="amber"
        />
        <StatCard
          label="Engage"
          value={data?.engageCount ?? 0}
          sub="opportunities"
          accent="green"
        />
      </div>

      {/* Spotlight row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top story right now */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Top story right now
          </p>

          {data?.topStory ? (
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-medium">
                  {data.topStory.competitor}
                </span>
                <span className={`text-[11px] font-medium ${TIER_COLOR[data.topStory.tier] ?? "text-[var(--text-muted)]"}`}>
                  {data.topStory.tier.charAt(0).toUpperCase() + data.topStory.tier.slice(1)}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {data.topStory.score}/10
                </span>
              </div>

              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug mb-1.5">
                {data.topStory.title}
              </p>

              {data.topStory.summary && (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3">
                  {data.topStory.summary}
                </p>
              )}

              <div className="border-t border-[var(--border-subtle)] pt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {data.topStory.source} ·{" "}
                  {formatDistanceToNow(new Date(data.topStory.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
                <a
                  href={data.topStory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-muted)] py-6 text-center">
              No intel available yet
            </p>
          )}
        </div>

        {/* Best engage opportunity */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] p-4">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Best engage opportunity
          </p>

          {data?.bestEngage ? (
            <div>
              <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                {PLATFORM_LABEL[data.bestEngage.platform] ?? data.bestEngage.platform} ·{" "}
                {data.bestEngage.source}
              </p>

              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug mb-2 line-clamp-2">
                {data.bestEngage.title}
              </p>

              {data.bestEngage.replyDraft && (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-3 italic">
                  &ldquo;
                  {data.bestEngage.replyDraft.length > 120
                    ? data.bestEngage.replyDraft.slice(0, 120) + "…"
                    : data.bestEngage.replyDraft}
                  &rdquo;
                </p>
              )}

              <div className="border-t border-[var(--border-subtle)] pt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {formatDistanceToNow(new Date(data.bestEngage.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
                <a
                  href={data.bestEngage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  View thread <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--text-muted)] py-6 text-center">
              No engagement opportunities yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
