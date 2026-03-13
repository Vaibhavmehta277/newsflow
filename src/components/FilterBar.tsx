"use client";

import { Search, RefreshCw, X } from "lucide-react";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  articleCount: number;
  fetchedAt?: string;
}

export default function FilterBar({
  search,
  onSearchChange,
  onRefresh,
  isRefreshing,
  articleCount,
  fetchedAt,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800/60 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles, keywords..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Article count */}
      <span className="text-xs text-zinc-600 hidden sm:block">
        {articleCount} articles
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last updated */}
      {fetchedAt && (
        <span className="text-[11px] text-zinc-600 hidden md:block">
          Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">
          {isRefreshing ? "Fetching..." : "Refresh"}
        </span>
      </button>
    </div>
  );
}
