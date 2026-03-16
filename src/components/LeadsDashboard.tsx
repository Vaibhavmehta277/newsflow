"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  Search,
  FlaskConical,
  Zap,
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
    const interval = setInterval(() => {
      fetchLeads(false);
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

  const hotItems = filteredItems.filter((i) => i.score >= 8);
  const warmItems = filteredItems.filter((i) => i.score >= 5 && i.score < 8);
  const watchingItems = filteredItems.filter((i) => i.score < 5);

  if (loading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <div className="animate-pulse space-y-1.5">
              <div className="h-3.5 bg-[var(--bg-elevated)] rounded-[4px] w-36" />
              <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-24" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-28" />
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-12" />
                  </div>
                  <div className="h-4 bg-[var(--bg-elevated)] rounded-[4px] w-4/5" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-6 h-6 text-[var(--red)]" />
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={() => fetchLeads()}
          className="text-xs text-[var(--accent)] hover:opacity-80 transition-opacity"
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h1 className="text-[13px] font-semibold text-[var(--text-primary)]">Lead Alerts</h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {data?.total ?? 0} potential leads found
              {fetchedAgo && ` · ${fetchedAgo}`}
            </p>
          </div>

          <button
            onClick={() => fetchLeads(true)}
            disabled={refreshing}
            className="h-[30px] px-3 rounded-[4px] text-[13px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {refreshing ? "Scanning…" : "Refresh"}
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] shrink-0">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter("all")}
              className={`text-[11px] px-2.5 py-1 rounded-[4px] border transition-all ${
                activeFilter === "all"
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--text-muted)]"
                  : "text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_LABELS) as LeadTriggerCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-[4px] border transition-all ${
                  activeFilter === cat
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--text-muted)]"
                    : "text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-8">
          {/* Demo data banner */}
          {data?.isDemo && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[6px] bg-[var(--amber-subtle)] border border-[var(--amber)] text-[var(--amber)] text-xs shrink-0">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>
                <strong>Showing sample data</strong> — real lead signals will appear once feeds are scanned.
                Feeds are checked every 10 minutes.
              </span>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Zap className="w-8 h-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                {data?.total === 0
                  ? "No lead signals found yet"
                  : "No leads match your filter"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {data?.total === 0
                  ? "Leads update every 10 minutes from Reddit + HN"
                  : "Try a different category filter"}
              </p>
            </div>
          ) : (
            <>
              {hotItems.length > 0 && (
                <section>
                  <div className="mb-3">
                    <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                      Hot <span className="font-normal">({hotItems.length})</span>
                    </p>
                    <div className="border-t border-[var(--border-subtle)] mt-2" />
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
                    {hotItems.map((item) => (
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
                </section>
              )}

              {warmItems.length > 0 && (
                <section>
                  <div className="mb-3">
                    <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                      Warm <span className="font-normal">({warmItems.length})</span>
                    </p>
                    <div className="border-t border-[var(--border-subtle)] mt-2" />
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
                    {warmItems.map((item) => (
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
                </section>
              )}

              {watchingItems.length > 0 && (
                <section>
                  <div className="mb-3">
                    <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                      Watching <span className="font-normal">({watchingItems.length})</span>
                    </p>
                    <div className="border-t border-[var(--border-subtle)] mt-2" />
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
                    {watchingItems.map((item) => (
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
                </section>
              )}
            </>
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
