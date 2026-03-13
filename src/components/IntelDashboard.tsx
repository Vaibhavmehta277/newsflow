"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  Shield,
  Flame,
  Thermometer,
  Eye,
  AlertCircle,
  Loader2,
  FlaskConical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { IntelItem } from "@/types";
import IntelCard from "./IntelCard";
import IntelSidePanel from "./IntelSidePanel";

interface IntelResponse {
  items: IntelItem[];
  total: number;
  hot: number;
  warm: number;
  watching: number;
  isDemo?: boolean;
  fetchedAt: string;
}

export default function IntelDashboard() {
  const { status } = useSession();
  const [data, setData] = useState<IntelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<IntelItem | null>(null);

  const fetchIntel = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const params = forceRefresh ? "?refresh=true" : "";
      const res = await fetch(`/api/intel${params}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load intelligence data. Check your OpenAI API key.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchIntel();
    // Auto-refresh every 10 minutes in the background
    const interval = setInterval(() => {
      fetchIntel(false); // silent refresh (no spinner)
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [status, fetchIntel]);

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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
        <p className="text-sm text-zinc-500">Scanning competitor signals…</p>
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
          onClick={() => fetchIntel()}
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
            <Shield className="w-5 h-5 text-orange-400" />
            <div>
              <h1 className="text-sm font-semibold text-zinc-100">
                Competitor Intelligence
              </h1>
              <p className="text-[11px] text-zinc-500">
                {data?.total ?? 0} competitor mentions found
                {fetchedAgo && ` · Updated ${fetchedAgo}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tier summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/25">
                <Flame className="w-3 h-3" />
                {data?.hot ?? 0} Hot
              </span>
              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                <Thermometer className="w-3 h-3" />
                {data?.warm ?? 0} Warm
              </span>
              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-zinc-700/40 text-zinc-400 border border-zinc-700/40">
                <Eye className="w-3 h-3" />
                {data?.watching ?? 0} Watching
              </span>
            </div>

            <button
              onClick={() => fetchIntel(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Scanning…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* Demo data banner */}
          {data?.isDemo && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <FlaskConical className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Showing sample data</strong> — real competitor signals will appear once feeds are scanned.
                Feeds are checked every 10 minutes.
              </span>
            </div>
          )}

          {/* 🔴 Hot Section */}
          {hotItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold text-red-300">
                  Hot Opportunities
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/25">
                  Score 8–10
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {hotItems.map((item) => (
                  <IntelCard
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

          {/* 🟡 Warm Section */}
          {warmItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-amber-300">
                  Warm Signals
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/25">
                  Score 5–7
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {warmItems.map((item) => (
                  <IntelCard
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

          {/* ⚪ Watching Section */}
          {watchingItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-400">Watching</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/40 text-zinc-500 border border-zinc-700/40">
                  Score 1–4
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {watchingItems.map((item) => (
                  <IntelCard
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
        <IntelSidePanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
