"use client";

import { useState } from "react";
import { ExternalLink, Copy, CheckCheck, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LeadItem, LeadTriggerCategory } from "@/types";
import { getFreshnessInfo, getPlatformBadgeClass, getPlatformLabel } from "@/lib/freshness";

interface LeadCardProps {
  item: LeadItem;
  isSelected: boolean;
  onClick: () => void;
}

const CATEGORY_CONFIG: Record<
  LeadTriggerCategory,
  { label: string; badge: string; emoji: string }
> = {
  "pain-point": {
    label: "Pain Point",
    badge: "bg-red-500/15 text-red-300 border-red-500/25",
    emoji: "😤",
  },
  "solution-seeking": {
    label: "Solution Seeking",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    emoji: "🔍",
  },
  "competitor-comparison": {
    label: "Competitor Comparison",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    emoji: "⚔️",
  },
  "industry-specific": {
    label: "Industry Signal",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/25",
    emoji: "🏭",
  },
};

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "text-red-400 bg-red-500/15 border-red-500/30";
  if (score >= 6) return "text-amber-400 bg-amber-500/15 border-amber-500/30";
  return "text-zinc-400 bg-zinc-800/50 border-zinc-700/50";
};

export default function LeadCard({ item, isSelected, onClick }: LeadCardProps) {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORY_CONFIG[item.triggerCategory];

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
    } catch {
      return "recently";
    }
  })();

  const handleCopyOutreach = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.outreachDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHot = item.score >= 7;
  const freshness = getFreshnessInfo(item.publishedAt);
  const platformBadge = getPlatformBadgeClass(item.platform ?? "rss");
  const platformLabel = getPlatformLabel(item.platform ?? "rss");

  return (
    <article
      onClick={onClick}
      className={`relative rounded-xl border bg-[#111113] p-4 cursor-pointer transition-all group ${
        isSelected
          ? "border-violet-500/40 ring-1 ring-violet-500/20 bg-violet-500/5"
          : isHot
          ? "border-red-500/20 hover:border-red-500/40 hover:bg-zinc-800/30"
          : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30"
      }`}
    >
      {/* Hot badge */}
      {isHot && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg">
          <Zap className="w-2.5 h-2.5" />
          HOT
        </div>
      )}

      {/* Category + Score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}
        >
          {cat.emoji} {cat.label}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${SCORE_COLOR(item.score)}`}
        >
          {item.score}/10
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">
        {item.summary}
      </p>

      {/* Trigger phrases */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {item.triggerPhrases.slice(0, 3).map((phrase) => (
          <span
            key={phrase}
            className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
          >
            "{phrase}"
          </span>
        ))}
      </div>

      {/* Outreach draft */}
      {item.outreachDraft && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2.5 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
              Suggested Outreach
            </span>
            <button
              onClick={handleCopyOutreach}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-blue-200/70 leading-relaxed italic">
            "{item.outreachDraft}"
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Freshness badge */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${freshness.colorClass}`}>
            {freshness.label}
          </span>
          {/* Platform badge */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${platformBadge}`}>
            {platformLabel}
          </span>
          <span className="text-[10px] text-zinc-600">{item.source}</span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-600">{timeAgo}</span>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition-colors shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      </div>
    </article>
  );
}
