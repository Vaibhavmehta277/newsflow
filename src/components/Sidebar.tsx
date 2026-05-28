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
} from "lucide-react";
import type { ArticleCategory } from "@/types";

interface SidebarProps {
  activeCategory: ArticleCategory | "all";
  onCategoryChange: (cat: ArticleCategory | "all") => void;
  counts?: Partial<Record<ArticleCategory | "all", number>>;
}

const NAV_ITEMS = [
  { category: "all" as const, label: "All Articles", icon: Rss },
  { category: "voice-ai" as const, label: "Voice AI", icon: Radio },
  { category: "use-case" as const, label: "Use Cases", icon: Briefcase },
  { category: "market-intel" as const, label: "Market Intel", icon: TrendingUp },
  { category: "cx" as const, label: "CX & Contact Center", icon: Headphones },
  { category: "ai-news" as const, label: "AI News", icon: Newspaper },
];

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  counts = {},
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-200">
        <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
          NewsFlow
        </span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.category && pathname === "/";
          const Icon = item.icon;
          const count = counts[item.category];
          return (
            <button
              key={item.category}
              onClick={() => onCategoryChange(item.category)}
              className={`w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-[15px] h-[15px]" />
                {item.label}
              </span>
              {count !== undefined && count > 0 && (
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-gray-100">
          <Link
            href="/dashboard"
            className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors ${
              pathname === "/dashboard"
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-[15px] h-[15px]" />
            Dashboard
          </Link>
        </div>
      </nav>

      {session?.user && (
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="flex items-center gap-2.5 px-2">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-medium">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-900 font-medium truncate">
                {session.user.name}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
