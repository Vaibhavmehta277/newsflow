"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Newspaper,
  Users,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { SheetRow } from "@/types";
import { CATEGORY_META } from "@/lib/keywords";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className={`p-2 rounded-lg bg-zinc-800 ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
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

  // Compute stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayRows = rows.filter((r) => r.date.startsWith(today));
  const postedRows = rows.filter((r) => r.status === "posted");
  const savedRows = rows.filter((r) => r.status === "saved");

  // Most active team member
  const memberCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.assignedTo) {
      memberCounts[row.assignedTo] = (memberCounts[row.assignedTo] || 0) + 1;
    }
  }
  const topMember =
    Object.entries(memberCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const row of rows.filter((r) => r.platform)) {
    platformCounts[row.platform] = (platformCounts[row.platform] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-1">{error}</p>
          <p className="text-xs text-zinc-600">
            Make sure your Google Sheets is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Team content activity overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Articles Today"
          value={todayRows.length}
          icon={Newspaper}
          color="text-violet-400"
        />
        <StatCard
          label="Total Saved"
          value={savedRows.length}
          icon={FileText}
          color="text-blue-400"
        />
        <StatCard
          label="Total Posted"
          value={postedRows.length}
          icon={CheckCircle2}
          color="text-emerald-400"
        />
        <StatCard
          label="Most Active"
          value={topMember.split(" ")[0]}
          icon={Users}
          color="text-amber-400"
        />
      </div>

      {/* Platform breakdown + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform breakdown */}
        {Object.keys(platformCounts).length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <h3 className="text-sm font-medium text-zinc-300">
                Posts by Platform
              </h3>
            </div>
            <div className="space-y-3">
              {Object.entries(platformCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const max = Math.max(...Object.values(platformCounts));
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400 capitalize">
                          {platform}
                        </span>
                        <span className="text-xs text-zinc-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div
          className={`${Object.keys(platformCounts).length > 0 ? "lg:col-span-2" : "lg:col-span-3"} bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-300">
              Recent Activity
            </h3>
          </div>
          {rows.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">
              No activity yet. Start curating articles!
            </p>
          ) : (
            <div className="space-y-2">
              {rows.slice(0, 10).map((row, i) => {
                const statusColors: Record<string, string> = {
                  posted: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  saved: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                  skipped: "text-zinc-500 bg-zinc-800 border-zinc-700",
                };
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-b border-zinc-800/40 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusColors[row.status] || statusColors.saved}`}
                        >
                          {row.status}
                        </span>
                        {row.platform && (
                          <span className="text-[10px] text-zinc-600 capitalize">
                            {row.platform}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">
                          {row.assignedTo}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {row.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-zinc-700">
                        {row.date.split(" ")[1] || row.date}
                      </span>
                      {row.url && (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-700 hover:text-zinc-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      {rows.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            Articles by Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const count = rows.filter((r) => {
                // Best effort match on keyword tag
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
                  className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30"
                >
                  <div className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <div>
                    <p className="text-[10px] text-zinc-500">{meta.label}</p>
                    <p className="text-sm font-medium text-zinc-300">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
