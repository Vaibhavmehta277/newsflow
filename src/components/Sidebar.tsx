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
  MessageSquare,
} from "lucide-react";
import type { ArticleCategory } from "@/types";

interface SidebarProps {
  activeCategory: ArticleCategory | "all";
  onCategoryChange: (cat: ArticleCategory | "all") => void;
  counts?: Partial<Record<ArticleCategory | "all", number>>;
  viewMode: "feed" | "youtube";
  onViewModeChange: (mode: "feed" | "youtube") => void;
  videoCount?: number;
  leadsCount?: number;
}

const NAV_ITEMS = [
  { category: "all" as const, label: "All Articles", icon: Rss },
  { category: "voice-ai" as const, label: "Voice AI", icon: Radio },
  { category: "use-case" as const, label: "Use Cases", icon: Briefcase },
  { category: "market-intel" as const, label: "Trending Topics", icon: TrendingUp },
  { category: "cx" as const, label: "CX & Contact Center", icon: Headphones },
  { category: "ai-news" as const, label: "AI News", icon: Newspaper },
];

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
  const [hotLeadsCount, setHotLeadsCount] = useState<number | undefined>(
    leadsCount ?? _cachedHotCount
  );
  const fetchedRef = useRef(false);

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
      .then((r) => (r.ok ? r.json() : null))
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

  // Shared nav item style helpers
  const baseItem =
    "relative w-full flex items-center gap-2.5 h-8 px-3 rounded-[4px] text-[13px] transition-colors";
  const inactiveItem =
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]";
  const activeItem =
    "text-[var(--text-primary)] bg-[var(--bg-elevated)] font-medium";

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--bg-base)] border-r border-[var(--border-subtle)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="w-7 h-7 rounded-[6px] bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <span className="text-[var(--text-primary)] font-medium text-[13px] tracking-tight">
            NewsFlow
          </span>
          <p className="text-[var(--text-muted)] text-[11px]">smallest.ai</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {/* FEED */}
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] px-3 mb-1 mt-1">
          Feed
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive =
            viewMode === "feed" && activeCategory === item.category && pathname === "/";
          const Icon = item.icon;
          const count = counts[item.category];
          return (
            <button
              key={item.category}
              onClick={() => {
                onViewModeChange("feed");
                onCategoryChange(item.category);
              }}
              className={`${baseItem} ${isActive ? activeItem : inactiveItem}`}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={isActive ? { color: 'var(--text-primary)' } : {}} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {count !== undefined && count > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">{count}</span>
              )}
            </button>
          );
        })}

        {/* DISCOVER */}
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] px-3 mb-1 mt-5">
          Discover
        </p>

        <button
          onClick={() => onViewModeChange("youtube")}
          className={`${baseItem} ${isYouTubeActive ? activeItem : inactiveItem}`}
        >
          {isYouTubeActive && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <Youtube className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={isYouTubeActive ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1 text-left">YouTube</span>
          {videoCount !== undefined && videoCount > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">{videoCount}</span>
          )}
        </button>

        {/* INTELLIGENCE */}
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] px-3 mb-1 mt-5">
          Intelligence
        </p>

        {/* Competitor Intel */}
        <Link
          href="/intel"
          className={`${baseItem} ${pathname === "/intel" ? activeItem : inactiveItem}`}
        >
          {pathname === "/intel" && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <Shield className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={pathname === "/intel" ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1">Competitor Intel</span>
        </Link>

        {/* Lead Alerts */}
        <Link
          href="/leads"
          className={`${baseItem} ${pathname === "/leads" ? activeItem : inactiveItem}`}
        >
          {pathname === "/leads" && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <Zap className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={pathname === "/leads" ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1">Lead Alerts</span>
          {hotLeadsCount !== undefined && hotLeadsCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[var(--red-subtle)] text-[var(--red)] font-medium shrink-0">
              {hotLeadsCount}
            </span>
          )}
        </Link>

        {/* Engage */}
        <Link
          href="/engage"
          className={`${baseItem} ${pathname === "/engage" ? activeItem : inactiveItem}`}
        >
          {pathname === "/engage" && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={pathname === "/engage" ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1">Engage</span>
        </Link>

        {/* Newsletter */}
        <Link
          href="/newsletter"
          className={`${baseItem} ${pathname === "/newsletter" ? activeItem : inactiveItem}`}
        >
          {pathname === "/newsletter" && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <Mail className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={pathname === "/newsletter" ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1">Newsletter</span>
        </Link>

        {/* TEAM */}
        <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] px-3 mb-1 mt-5">
          Team
        </p>

        <Link
          href="/dashboard"
          className={`${baseItem} ${pathname === "/dashboard" ? activeItem : inactiveItem}`}
        >
          {pathname === "/dashboard" && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--accent)] rounded-r" />
          )}
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" style={pathname === "/dashboard" ? { color: 'var(--text-primary)' } : {}} />
          <span className="flex-1">Dashboard</span>
        </Link>
      </nav>

      {/* User */}
      {session?.user && (
        <div className="px-2 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[4px]">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-6 h-6 rounded-[4px] shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-[4px] bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                {session.user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--text-primary)] font-medium truncate leading-tight">
                {session.user.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
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
