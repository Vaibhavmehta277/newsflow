"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  Newspaper,
  Users,
  TrendingUp,
  Clock,
  ExternalLink,
  AlertCircle,
  Eye,
  ArrowUpRight,
  BarChart3,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import type { SheetRow } from "@/types";
import { CATEGORY_META } from "@/lib/keywords";

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        {trend && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              trend.positive
                ? "text-green-700 bg-green-50"
                : "text-gray-500 bg-gray-50"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
      <p className="text-[12px] text-gray-500 mt-1">{label}</p>
      {subtitle && (
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div>
          <h3 className="text-[14px] font-medium text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const res = await fetch("/api/sheets");
        if (!res.ok) throw new Error("Failed to fetch");
        const { rows: data } = await res.json();
        setRows(data || []);
      } catch {
        setError("Could not load data from Google Sheets.");
      } finally {
        setLoading(false);
      }
    };
    fetchRows();
  }, []);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRows = rows.filter((r) => r.date.startsWith(today));
  const postedRows = rows.filter((r) => r.status === "posted");
  const savedRows = rows.filter((r) => r.status === "saved");

  const memberCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.assignedTo) {
      memberCounts[row.assignedTo] = (memberCounts[row.assignedTo] || 0) + 1;
    }
  }
  const topMember =
    Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const platformCounts: Record<string, number> = {};
  for (const row of rows.filter((r) => r.platform)) {
    platformCounts[row.platform] = (platformCounts[row.platform] || 0) + 1;
  }

  const leadAlerts = useMemo(() => {
    return rows.filter((r) => {
      const tag = r.keywordTag?.toLowerCase() || "";
      return (
        tag.includes("voice ai") ||
        tag.includes("ai voice agent") ||
        tag.includes("voice bot") ||
        tag.includes("ai receptionist") ||
        tag.includes("ai call center")
      );
    }).slice(0, 5);
  }, [rows]);

  const competitorIntel = useMemo(() => {
    return rows.filter((r) => {
      const tag = r.keywordTag?.toLowerCase() || "";
      return (
        tag.includes("vapi") ||
        tag.includes("retell") ||
        tag.includes("elevenlabs") ||
        tag.includes("bland ai") ||
        tag.includes("synthflow") ||
        tag.includes("funding") ||
        tag.includes("voice ai startup")
      );
    }).slice(0, 5);
  }, [rows]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-48 bg-gray-50 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-100 rounded-lg mb-4" />
              <div className="h-7 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="p-3 rounded-full bg-red-50 w-fit mx-auto mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-[14px] text-gray-700 mb-1">{error}</p>
          <p className="text-[13px] text-gray-400">
            Make sure your Google Sheets is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Team content activity overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Articles Today"
          value={todayRows.length}
          icon={Newspaper}
          trend={todayRows.length > 0 ? { value: `+${todayRows.length} today`, positive: true } : undefined}
        />
        <StatCard
          label="Total Saved"
          value={savedRows.length}
          subtitle="Ready for review"
          icon={FileText}
        />
        <StatCard
          label="Total Posted"
          value={postedRows.length}
          subtitle="Published content"
          icon={CheckCircle2}
          trend={postedRows.length > 0 ? { value: `${Math.round((postedRows.length / Math.max(rows.length, 1)) * 100)}% rate`, positive: true } : undefined}
        />
        <StatCard
          label="Most Active"
          value={topMember.split(" ")[0]}
          subtitle={memberCounts[topMember] ? `${memberCounts[topMember]} articles` : undefined}
          icon={Users}
        />
      </div>

      {/* Lead Alerts + Competitor Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Alerts */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={AlertCircle}
            title="Lead Alerts"
            subtitle="High-relevance Voice AI mentions"
          />
          {leadAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="p-2.5 rounded-full bg-gray-50 mb-2">
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[13px] text-gray-500">No lead alerts yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Articles matching core Voice AI keywords will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {leadAlerts.map((row, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-gray-800 font-medium leading-snug truncate">
                      {row.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400">{row.source}</span>
                      {row.keywordTag && (
                        <>
                          <span className="text-[11px] text-gray-300">&middot;</span>
                          <span className="text-[11px] text-gray-400 truncate">
                            {row.keywordTag.split(",")[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitor Intel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={Eye}
            title="Competitor Intel"
            subtitle="Market moves & competitor activity"
          />
          {competitorIntel.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="p-2.5 rounded-full bg-gray-50 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[13px] text-gray-500">No competitor intel yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Mentions of Vapi, ElevenLabs, Retell, etc. will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {competitorIntel.map((row, i) => {
                const competitor = (row.keywordTag?.toLowerCase() || "").includes("vapi")
                  ? "Vapi"
                  : (row.keywordTag?.toLowerCase() || "").includes("elevenlabs")
                  ? "ElevenLabs"
                  : (row.keywordTag?.toLowerCase() || "").includes("retell")
                  ? "Retell"
                  : (row.keywordTag?.toLowerCase() || "").includes("bland")
                  ? "Bland AI"
                  : (row.keywordTag?.toLowerCase() || "").includes("synthflow")
                  ? "Synthflow"
                  : "Competitor";
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold text-gray-500">
                        {competitor.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-800 font-medium leading-snug truncate">
                        {row.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                          {competitor}
                        </span>
                        <span className="text-[11px] text-gray-400">{row.source}</span>
                      </div>
                    </div>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Platform Breakdown + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Platform Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={BarChart3}
            title="Posts by Platform"
            subtitle="Content distribution"
          />
          {Object.keys(platformCounts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="p-2.5 rounded-full bg-gray-50 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[13px] text-gray-500">No platform data yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Post articles to see platform breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(platformCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const max = Math.max(...Object.values(platformCounts));
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] text-gray-700 font-medium capitalize">
                          {platform}
                        </span>
                        <span className="text-[12px] text-gray-400 tabular-nums">
                          {count} posts
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={Tag}
            title="Articles by Category"
            subtitle="Content topic distribution"
          />
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="p-2.5 rounded-full bg-gray-50 mb-2">
                <Tag className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-[13px] text-gray-500">No category data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                const count = rows.filter((r) => {
                  const tag = r.keywordTag?.toLowerCase() || "";
                  return (
                    (cat === "voice-ai" &&
                      (tag.includes("voice") || tag.includes("tts"))) ||
                    (cat === "use-case" && tag.includes("ai for")) ||
                    (cat === "market-intel" &&
                      (tag.includes("vapi") ||
                        tag.includes("elevenlabs") ||
                        tag.includes("funding"))) ||
                    (cat === "cx" &&
                      (tag.includes("contact") || tag.includes("customer"))) ||
                    cat === "ai-news"
                  );
                }).length;
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-semibold text-gray-900">{count}</span>
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-700 font-medium">{meta.label}</p>
                      <p className="text-[11px] text-gray-400">
                        {count === 1 ? "article" : "articles"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Activity + Member Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={Clock}
            title="Recent Activity"
            subtitle="Latest team actions"
          />
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[13px] text-gray-500">No activity yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Start curating articles to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {rows.slice(0, 8).map((row, i) => {
                const statusStyles: Record<string, string> = {
                  posted: "text-green-700 bg-green-50 border border-green-100",
                  saved: "text-gray-600 bg-gray-50 border border-gray-100",
                  skipped: "text-gray-400 bg-gray-50 border border-gray-100",
                };
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 group"
                  >
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyles[row.status] || statusStyles.saved}`}
                    >
                      {row.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 truncate">
                        {row.title}
                      </p>
                    </div>
                    {row.platform && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0 capitalize">
                        {row.platform}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {row.assignedTo}
                    </span>
                    <span className="text-[11px] text-gray-300 shrink-0">
                      {row.date.split(" ")[1] || row.date}
                    </span>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionHeader
            icon={Users}
            title="Team Members"
            subtitle="Contribution breakdown"
          />
          {Object.keys(memberCounts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[13px] text-gray-500">No members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(memberCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const total = rows.length;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-medium text-white">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-800 font-medium truncate">
                          {name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                            {count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
