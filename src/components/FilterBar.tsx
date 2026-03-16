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
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-base)] sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles, keywords..."
          className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] pl-9 pr-8 h-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Article count */}
      <span className="text-xs text-[var(--text-muted)] hidden sm:block">
        {articleCount} articles
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last updated */}
      {fetchedAt && (
        <span className="text-[11px] text-[var(--text-muted)] hidden md:block">
          Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 px-3 h-8 rounded-[4px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
