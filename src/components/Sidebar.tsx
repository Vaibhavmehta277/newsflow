"use client";

import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  Newspaper,
  Zap,
  Eye,
  AlertTriangle,
  MessageCircle,
  LogOut,
} from "lucide-react";
import type { Section } from "@/types";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  counts?: Partial<Record<Section, number>>;
}

const SECTIONS: {
  section: Section;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { section: "overview", label: "Overview", icon: LayoutGrid },
  { section: "pain-points", label: "Pain Points", icon: AlertTriangle },
  { section: "lead-alerts", label: "Lead Alerts", icon: Zap },
  { section: "competitor-watch", label: "Competitor Intel", icon: Eye },
  { section: "reddit", label: "Reddit", icon: MessageCircle },
  { section: "feed", label: "All Articles", icon: Newspaper },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  counts = {},
}: SidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className="w-52 shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center px-5 h-14 border-b border-gray-100">
        <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
          NewsFlow
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {SECTIONS.map(({ section, label, icon: Icon }) => {
            const isActive = activeSection === section;
            const count = counts[section];
            return (
              <button
                key={section}
                onClick={() => onSectionChange(section)}
                className={`w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-[15px] h-[15px]" />
                  {label}
                </span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[11px] tabular-nums ${
                      isActive ? "text-gray-400" : "text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {session?.user && (
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[11px] font-medium">
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
