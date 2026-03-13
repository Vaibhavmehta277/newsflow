"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  Zap,
  AlertCircle,
  Loader2,
  Search,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LeadItem, LeadTriggerCategory } from "@/types";
import LeadCard from "./LeadCard";
import LeadSidePanel from "./LeadSidePanel";

interface LeadsResponse {
  items: LeadItem[];
  total: number;
  hot: number;
  isDemo?: boolean;
  fetchedAt: string;
}

const CATEGORY_LABELS: Record<LeadTriggerCategory, string> = {
  "pain-point": "Pain Points",
  "solution-seeking": "Solution Seeking",
  "competitor-comparison": "Competitor Comparison",
  "industry-specific": "Industry Specific",
};

export default function LeadsDashboard() {
  const { status } = useSession();
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<LeadItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<LeadTriggerCategory | "all">("all");
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = forceRefresh ? "?refresh=true" : "";
      const res = await fetch(`/api/leads${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load lead data. Check your OpenAI API key.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchLeads();
    // Auto-refresh every 10 minutes in the background
    const interval = setInterval(() => {
      fetchLeads(false); // silent refresh (no spinner)
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [status, fetchLeads]);

  const fetchedAgo = data?.fetchedAt
    ? (() => {
        try {
          return formatDistanceToNow(new Date(data.fetchedAt), { addSuffix: true });
        } catch {
          return "";
        }
      })()
    : "";

  const filteredItems = (data?.items ?? []).filter((item) => {
    const matchesFilter = activeFilter === "all" || item.triggerCategory === activeFilter;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.outreachDraft.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const hotCount = (data?.items ?? []).filter((i) => i.score >= 7).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <p className="text-sm text-zinc-500">Scanning for lead signals…</p>
        <p className="text-xs text-zinc-600">
          This may take 30–60 seconds on first load
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          onClick={() => fetchLeads()}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Lead Trigger Alerts
              {hotCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                  🔥 {hotCount} hot
                </span>
              )}
            </h1>
            <p className="text-[11px] text-zinc-500">
              {data?.total ?? 0} potential leads found
              {fetchedAgo && ` · Updated ${fetchedAgo}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLeads(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Scanning…" : "Refresh"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800/40 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
              activeFilter === "all"
                ? "bg-zinc-700 text-white border-zinc-600"
                : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as LeadTriggerCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                activeFilter === cat
                  ? "bg-zinc-700 text-white border-zinc-600"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {/* Demo data banner */}
        {data?.isDemo && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs shrink-0">
            <FlaskConical className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Showing sample data</strong> — real lead signals will appear once feeds are scanned.
              Feeds are checked every 10 minutes.
            </span>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Zap className="w-8 h-8 text-zinc-700" />
            <p className="text-sm text-zinc-400">
              {data?.total === 0
                ? "No lead signals found yet"
                : "No leads match your filter"}
            </p>
            <p className="text-xs text-zinc-600">
              {data?.total === 0
                ? "Leads update every 10 minutes from Reddit + HN"
                : "Try a different category filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
            {filteredItems.map((item) => (
              <LeadCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() =>
                  setSelectedItem(selectedItem?.id === item.id ? null : item)
                }
              />
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Side Panel */}
      {selectedItem && (
        <LeadSidePanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
