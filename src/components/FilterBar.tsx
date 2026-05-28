"use client";

import { useState, useEffect, useRef } from "react";
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
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  return (
    <div className="flex items-center gap-3 px-6 h-12 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search articles..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
        />
        {localSearch && (
          <button
            onClick={() => { setLocalSearch(""); onSearchChange(""); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <span className="text-[12px] text-gray-400">
        {articleCount} articles
      </span>

      <div className="flex-1" />

      {fetchedAt && (
        <span className="text-[12px] text-gray-400 hidden md:block" suppressHydrationWarning>
          Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">
          {isRefreshing ? "Fetching..." : "Refresh"}
        </span>
      </button>
    </div>
  );
}
