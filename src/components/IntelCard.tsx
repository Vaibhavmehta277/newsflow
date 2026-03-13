"use client";

import { ExternalLink, TrendingDown, Flame, Thermometer, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { IntelItem } from "@/types";
import { getFreshnessInfo, getPlatformBadgeClass, getPlatformLabel } from "@/lib/freshness";

interface IntelCardProps {
  item: IntelItem;
  isSelected: boolean;
  onClick: () => void;
}

const TIER_CONFIG = {
  hot: {
    label: "🔴 Hot",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    glow: "border-red-500/30 hover:border-red-500/50",
    dot: "bg-red-400",
    icon: Flame,
    iconColor: "text-red-400",
  },
  warm: {
    label: "🟡 Warm",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    glow: "border-amber-500/30 hover:border-amber-500/50",
    dot: "bg-amber-400",
    icon: Thermometer,
    iconColor: "text-amber-400",
  },
  watching: {
    label: "⚪ Watching",
    badge: "bg-zinc-700/50 text-zinc-400 border border-zinc-700/50",
    glow: "border-zinc-800 hover:border-zinc-700",
    dot: "bg-zinc-500",
    icon: Eye,
    iconColor: "text-zinc-500",
  },
} as const;

export default function IntelCard({ item, isSelected, onClick }: IntelCardProps) {
  const tier = TIER_CONFIG[item.tier];
  const TierIcon = tier.icon;
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
    } catch {
      return "recently";
    }
  })();
  const freshness = getFreshnessInfo(item.publishedAt);
  const platformBadge = getPlatformBadgeClass(item.platform ?? "rss");
  const platformLabel = getPlatformLabel(item.platform ?? "rss");

  return (
    <article
      onClick={onClick}
      className={`relative rounded-xl border bg-[#111113] p-4 cursor-pointer transition-all group ${
        isSelected
          ? "border-violet-500/40 ring-1 ring-violet-500/20 bg-violet-500/5"
          : `${tier.glow} hover:bg-zinc-800/30`
      }`}
    >
      {/* Score badge + tier label */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Competitor chip */}
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-300 font-medium">
            {item.competitor}
          </span>
          {/* Extra competitors */}
          {item.mentionedCompetitors.length > 1 &&
            item.mentionedCompetitors.slice(1, 3).map((c) => (
              <span
                key={c}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500"
              >
                {c}
              </span>
            ))}
        </div>

        {/* Score pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TierIcon className={`w-3.5 h-3.5 ${tier.iconColor}`} />
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tier.badge}`}
          >
            {item.score}/10
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
        {item.title}
      </h3>

      {/* Summary snippet */}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">
        {item.summary}
      </p>

      {/* Opportunity note */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingDown className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            Sales Opportunity
          </span>
        </div>
        <p className="text-xs text-emerald-300/80 leading-relaxed">
          {item.opportunityNote}
        </p>
      </div>

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
          Source
        </a>
      </div>
    </article>
  );
}
