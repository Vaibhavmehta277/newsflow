"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  Rss,
  LayoutDashboard,
  Radio,
  Briefcase,
  TrendingUp,
  Headphones,
  Newspaper,
  LogOut,
  Zap,
  Youtube,
  Shield,
  Mail,
} from "lucide-react";
import type { ArticleCategory } from "@/types";

interface SidebarProps {
  activeCategory: ArticleCategory | "all";
  onCategoryChange: (cat: ArticleCategory | "all") => void;
  counts?: Partial<Record<ArticleCategory | "all", number>>;
  /** Controls whether the RSS feed or YouTube section is active. */
  viewMode: "feed" | "youtube";
  onViewModeChange: (mode: "feed" | "youtube") => void;
  /** Badge count shown on the YouTube nav item. */
  videoCount?: number;
  /** Hot lead count shown as 🔥 badge on the Leads nav item. */
  leadsCount?: number;
}

const NAV_ITEMS = [
  {
    category: "all" as const,
    label: "All Articles",
    icon: Rss,
    color: "text-zinc-400",
    activeColor: "text-white",
    activeBg: "bg-zinc-700/50",
  },
  {
    category: "voice-ai" as const,
    label: "Voice AI",
    icon: Radio,
    color: "text-violet-400",
    activeColor: "text-violet-300",
    activeBg: "bg-violet-500/20",
  },
  {
    category: "use-case" as const,
    label: "Use Cases",
    icon: Briefcase,
    color: "text-blue-400",
    activeColor: "text-blue-300",
    activeBg: "bg-blue-500/20",
  },
  {
    category: "market-intel" as const,
    label: "Market Intel",
    icon: TrendingUp,
    color: "text-amber-400",
    activeColor: "text-amber-300",
    activeBg: "bg-amber-500/20",
  },
  {
    category: "cx" as const,
    label: "CX & Contact Center",
    icon: Headphones,
    color: "text-emerald-400",
    activeColor: "text-emerald-300",
    activeBg: "bg-emerald-500/20",
  },
  {
    category: "ai-news" as const,
    label: "AI News",
    icon: Newspaper,
    color: "text-rose-400",
    activeColor: "text-rose-300",
    activeBg: "bg-rose-500/20",
  },
];

// Cache for hot lead count — fetched once per 30 min app-wide
let _cachedHotCount: number | undefined;
let _cachedAt = 0;

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  counts = {},
  viewMode,
  onViewModeChange,
  videoCount,
  leadsCount,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [hotLeadsCount, setHotLeadsCount] = useState<number | undefined>(leadsCount ?? _cachedHotCount);
  const fetchedRef = useRef(false);

  // Self-fetch hot lead count in the background (max once per 30 min)
  useEffect(() => {
    if (status !== "authenticated") return;
    if (fetchedRef.current) return;
    const staleness = Date.now() - _cachedAt;
    if (_cachedHotCount !== undefined && staleness < 30 * 60 * 1000) {
      setHotLeadsCount(_cachedHotCount);
      return;
    }
    fetchedRef.current = true;
    fetch("/api/leads")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.hot !== undefined) {
          _cachedHotCount = data.hot;
          _cachedAt = Date.now();
          setHotLeadsCount(data.hot);
        }
      })
      .catch(() => {});
  }, [status]);

  const isYouTubeActive = viewMode === "youtube" && pathname === "/";

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-[#111113] border-r border-zinc-800/60">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-tight">
            NewsFlow
          </span>
          <p className="text-zinc-500 text-[10px]">Voice AI Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* ── RSS Feed section ─────────────────────────────────────────── */}
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 mb-2">
          Feed
        </p>
        {NAV_ITEMS.map((item) => {
          // Only highlight when in feed mode, matching category, on home route
          const isActive =
            viewMode === "feed" &&
            activeCategory === item.category &&
            pathname === "/";
          const Icon = item.icon;
          const count = counts[item.category];
          return (
            <button
              key={item.category}
              onClick={() => {
                onViewModeChange("feed"); // switch back from YouTube if needed
                onCategoryChange(item.category);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? `${item.activeBg} ${item.activeColor} font-medium`
                  : `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50`
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${isActive ? item.activeColor : item.color}`}
                />
                {item.label}
              </span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/10 text-white" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* ── Discover section (YouTube) ───────────────────────────────── */}
        <div className="pt-3 mt-3 border-t border-zinc-800/60">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 mb-2">
            Discover
          </p>
          <button
            onClick={() => onViewModeChange("youtube")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              isYouTubeActive
                ? "bg-red-500/20 text-red-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Youtube
                className={`w-4 h-4 ${
                  isYouTubeActive ? "text-red-400" : "text-red-500"
                }`}
              />
              YouTube
            </span>
            {videoCount !== undefined && videoCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isYouTubeActive
                    ? "bg-white/10 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {videoCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Intelligence section ─────────────────────────────────────── */}
        <div className="pt-3 mt-3 border-t border-zinc-800/60">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 mb-2">
            Intelligence
          </p>

          {/* Competitor Intel */}
          <Link
            href="/intel"
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              pathname === "/intel"
                ? "bg-orange-500/20 text-orange-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Shield
                className={`w-4 h-4 ${
                  pathname === "/intel" ? "text-orange-400" : "text-orange-500"
                }`}
              />
              Competitor Intel
            </span>
          </Link>

          {/* Lead Alerts */}
          <Link
            href="/leads"
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              pathname === "/leads"
                ? "bg-blue-500/20 text-blue-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Zap
                className={`w-4 h-4 ${
                  pathname === "/leads" ? "text-blue-400" : "text-blue-500"
                }`}
              />
              Lead Alerts
            </span>
            {hotLeadsCount !== undefined && hotLeadsCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                🔥 {hotLeadsCount}
              </span>
            )}
          </Link>

          {/* Newsletter */}
          <Link
            href="/newsletter"
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              pathname === "/newsletter"
                ? "bg-violet-500/20 text-violet-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Mail
                className={`w-4 h-4 ${
                  pathname === "/newsletter" ? "text-violet-400" : "text-violet-500"
                }`}
              />
              Newsletter
            </span>
          </Link>
        </div>

        {/* ── Team section ─────────────────────────────────────────────── */}
        <div className="pt-3 mt-3 border-t border-zinc-800/60">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 mb-2">
            Team
          </p>
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
              pathname === "/dashboard"
                ? "bg-zinc-700/50 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </nav>

      {/* User */}
      {session?.user && (
        <div className="px-3 py-4 border-t border-zinc-800/60">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-medium">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-200 font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
