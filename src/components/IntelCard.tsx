"use client";

import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { IntelItem } from "@/types";

interface IntelCardProps {
  item: IntelItem;
  isSelected: boolean;
  onClick: () => void;
}

const TIER_CONFIG = {
  hot: { label: "Hot", textColor: "text-[var(--red)]", cardBorder: "border-[var(--border)] hover:border-[#2e2e2e]" },
  warm: { label: "Warm", textColor: "text-[var(--amber)]", cardBorder: "border-[var(--border)] hover:border-[#2e2e2e]" },
  watching: { label: "Watching", textColor: "text-[var(--text-muted)]", cardBorder: "border-[var(--border)] hover:border-[#2e2e2e]" },
} as const;

export default function IntelCard({ item, isSelected, onClick }: IntelCardProps) {
  const tier = TIER_CONFIG[item.tier];

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }); }
    catch { return "recently"; }
  })();

  const platformLabel: Record<string, string> = {
    reddit: "Reddit", rss: "RSS", hn: "HN", github: "GitHub", producthunt: "Product Hunt",
  };

  return (
    <article
      onClick={onClick}
      className={`rounded-[6px] border bg-[var(--bg-surface)] p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-[var(--accent-border)] ring-1 ring-[var(--accent-border)] bg-[var(--accent-subtle)]"
          : `${tier.cardBorder} hover:bg-[var(--bg-elevated)]`
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0">
            {item.competitor}
          </span>
          {item.mentionedCompetitors.slice(1, 2).map((c) => (
            <span key={c} className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)]">
              {c}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-medium ${tier.textColor}`}>{tier.label}</span>
          <span className="text-[11px] text-[var(--text-muted)]">{item.score}/10</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[14px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 mb-1.5">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
        {item.summary}
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
