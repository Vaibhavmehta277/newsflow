"use client";

import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { EngageItem, EngageTopicTag } from "@/types";

interface EngageCardProps {
  item: EngageItem;
  isSelected: boolean;
  onClick: () => void;
}

const TIER_CONFIG = {
  hot: { label: "Hot", textColor: "text-[var(--red)]" },
  warm: { label: "Warm", textColor: "text-[var(--amber)]" },
  watching: { label: "Watching", textColor: "text-[var(--text-muted)]" },
} as const;

const TAG_LABELS: Record<EngageTopicTag, string> = {
  "voice-ai-discussion": "Voice AI",
  "competitor-mention": "Competitor",
  "pain-point-thread": "Pain Point",
  "solution-request": "Solution Request",
  "industry-news": "Industry News",
};

export default function EngageCard({ item, isSelected, onClick }: EngageCardProps) {
  const tier = TIER_CONFIG[item.tier];

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }); }
    catch { return "recently"; }
  })();

  const platformLabel: Record<string, string> = {
    reddit: "Reddit", hn: "HN", producthunt: "Product Hunt",
  };

  return (
    <article
      onClick={onClick}
      className={`rounded-[6px] border bg-[var(--bg-surface)] p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-[var(--accent-border)] ring-1 ring-[var(--accent-border)] bg-[var(--accent-subtle)]"
          : "border-[var(--border)] hover:border-[#2e2e2e] hover:bg-[var(--bg-elevated)]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium ${tier.textColor}`}>{tier.label}</span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {TAG_LABELS[item.topicTag] ?? item.topicTag}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] shrink-0">{item.score}/10</span>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 mb-1.5">
        {item.title}
      </h3>

      {/* Snippet */}
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
        {item.snippet}
      </p>

      {/* Divider */}
      <div className="border-t border-[var(--border-subtle)] my-2.5" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-muted)]">
          {platformLabel[item.platform] ?? item.platform} · {item.source} · {timeAgo}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
