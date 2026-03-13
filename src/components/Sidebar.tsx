"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
} from "lucide-react";
import type { ArticleCategory } from "@/types";

interface SidebarProps {
  activeCategory: ArticleCategory | "all";
  onCategoryChange: (cat: ArticleCategory | "all") => void;
  counts?: Partial<Record<ArticleCategory | "all", number>>;
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

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  counts = {},
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

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
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider px-2 mb-2">
          Feed
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.category && pathname === "/";
          const Icon = item.icon;
          const count = counts[item.category];
          return (
            <button
              key={item.category}
              onClick={() => onCategoryChange(item.category)}
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
