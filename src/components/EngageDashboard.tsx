"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { EngageItem } from "@/types";
import EngageCard from "./EngageCard";
import EngageSidePanel from "./EngageSidePanel";

interface EngageResponse {
  items: EngageItem[];
  total: number;
  hot: number;
  warm: number;
  watching: number;
  isDemo?: boolean;
  fetchedAt: string;
}

export default function EngageDashboard() {
  const { status } = useSession();
  const [data, setData] = useState<EngageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<EngageItem | null>(null);

  const fetchEngage = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = forceRefresh ? "?refresh=true" : "";
      const res = await fetch(`/api/engage${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load engagement data. Check your OpenAI API key.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchEngage();
    const interval = setInterval(() => fetchEngage(false), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [status, fetchEngage]);

  const hotItems = data?.items.filter((i) => i.tier === "hot") ?? [];
  const warmItems = data?.items.filter((i) => i.tier === "warm") ?? [];
  const watchingItems = data?.items.filter((i) => i.tier === "watching") ?? [];

  const fetchedAgo = data?.fetchedAt
    ? (() => {
        try {
          return formatDistanceToNow(new Date(data.fetchedAt), { addSuffix: true });
        } catch {
          return "";
        }
      })()
    : "";

  if (loading) {
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <div className="animate-pulse space-y-1.5">
              <div className="h-3.5 bg-[var(--bg-elevated)] rounded-[4px] w-40" />
              <div className="h-2.5 bg-[var(--bg-elevated)] rounded-[4px] w-28" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] p-4 space-y-3"
                >
                  <div className="flex justify-between">
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-24" />
                    <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-16" />
                  </div>
                  <div className="h-4 bg-[var(--bg-elevated)] rounded-[4px] w-3/4" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
                  <div className="h-3 bg-[var(--bg-elevated)] rounded-[4px] w-2/3" />
                  <div className="h-8 bg-[var(--bg-elevated)] rounded-[4px] w-full" />
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
          onClick={() => fetchEngage()}
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
            <h1 className="text-[13px] font-semibold text-[var(--text-primary)]">Engage</h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {data?.total ?? 0} threads worth engaging
              {fetchedAgo && ` · ${fetchedAgo}`}
            </p>
          </div>

          <button
            onClick={() => fetchEngage(true)}
            disabled={refreshing}
            className="h-[30px] px-3 rounded-[4px] text-[13px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {refreshing ? "Scanning…" : "Refresh"}
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* Demo data banner */}
          {data?.isDemo && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[6px] bg-[var(--amber-subtle)] border border-[var(--amber)] text-[var(--amber)] text-xs">
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>
                <strong>Showing sample data</strong> — real engagement opportunities will appear once feeds are scanned.
                Feeds are checked every 10 minutes.
              </span>
            </div>
          )}

          {/* Empty state (no items and not demo) */}
          {data !== null && data.items.length === 0 && !data.isDemo && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                No engagement opportunities found yet. Feeds are scanned every 10 minutes.
              </p>
              <button
                onClick={() => fetchEngage(true)}
                disabled={refreshing}
                className="h-[30px] px-3 rounded-[4px] text-[13px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                {refreshing ? "Scanning…" : "Scan now"}
              </button>
            </div>
          )}

          {/* Hot Section */}
          {hotItems.length > 0 && (
            <section>
              <div className="mb-3">
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                  Hot <span className="font-normal">({hotItems.length})</span>
                </p>
                <div className="border-t border-[var(--border-subtle)] mt-2" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {hotItems.map((item) => (
                  <EngageCard
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

          {/* Warm Section */}
          {warmItems.length > 0 && (
            <section>
              <div className="mb-3">
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                  Warm <span className="font-normal">({warmItems.length})</span>
                </p>
                <div className="border-t border-[var(--border-subtle)] mt-2" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {warmItems.map((item) => (
                  <EngageCard
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

          {/* Watching Section */}
          {watchingItems.length > 0 && (
            <section>
              <div className="mb-3">
                <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                  Watching <span className="font-normal">({watchingItems.length})</span>
                </p>
                <div className="border-t border-[var(--border-subtle)] mt-2" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {watchingItems.map((item) => (
                  <EngageCard
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
        </div>
      </div>

      {/* Side Panel */}
      {selectedItem && (
        <EngageSidePanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
