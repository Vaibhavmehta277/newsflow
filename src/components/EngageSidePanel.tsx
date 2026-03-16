"use client";

import { useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  Copy,
  CheckCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { EngageItem, EngageTopicTag } from "@/types";
import { getPlatformLabel } from "@/lib/freshness";

interface EngageSidePanelProps {
  item: EngageItem;
  onClose: () => void;
}

const TIER_TEXT: Record<string, { label: string; color: string }> = {
  hot:      { label: "Hot",      color: "text-[var(--red)]" },
  warm:     { label: "Warm",     color: "text-[var(--amber)]" },
  watching: { label: "Watching", color: "text-[var(--text-muted)]" },
};

const TAG_LABELS: Record<EngageTopicTag, string> = {
  "voice-ai-discussion": "Voice AI Discussion",
  "competitor-mention":  "Competitor Mention",
  "pain-point-thread":   "Pain Point Thread",
  "solution-request":    "Solution Request",
  "industry-news":       "Industry News",
};

export default function EngageSidePanel({ item, onClose }: EngageSidePanelProps) {
  const [userNote, setUserNote] = useState("");
  const [replyDraft, setReplyDraft] = useState(item.replyDraft);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const [copied, setCopied] = useState(false);

  const tier = TIER_TEXT[item.tier] ?? TIER_TEXT.watching;
  const platformLabel = getPlatformLabel(item.platform);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setRegenError("");
    try {
      const res = await fetch("/api/engage-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          snippet: item.snippet,
          url: item.url,
          topicTag: item.topicTag,
          angle: item.engagementAngle,
          userNote: userNote.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const { reply } = await res.json();
      setReplyDraft(reply);
    } catch {
      setRegenError("Failed to regenerate. Check your API key.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(replyDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <aside className="w-[420px] shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-medium ${tier.color}`}>{tier.label}</span>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] text-[var(--text-muted)]">{item.score}/10</span>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {TAG_LABELS[item.topicTag] ?? item.topicTag}
            </span>
          </div>
          <h2 className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">
            {item.title}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
            {platformLabel} · {item.source} · {format(new Date(item.publishedAt), "MMM d, h:mm a")}
            {item.commentCount !== undefined && item.commentCount > 0 && ` · ${item.commentCount} comments`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 text-lg leading-none mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Thread snippet */}
        {item.snippet && (
          <div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{item.snippet}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-[var(--accent)] hover:opacity-80 mt-2 transition-opacity"
            >
              View thread <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Engagement angle — quiet box */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[4px] px-4 py-3">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-2">
            Engagement Angle
          </p>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {item.engagementAngle}
          </p>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Reply draft */}
        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Draft Reply
          </p>

          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            rows={6}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] resize-none transition-all"
          />

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopy}
              className={`h-[30px] flex items-center gap-1.5 px-3 rounded-[4px] text-[12px] border transition-all ${
                copied
                  ? "bg-[var(--green-subtle)] text-[var(--green)] border-[var(--green)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]"
              }`}
            >
              {copied ? <><CheckCheck className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[30px] flex items-center gap-1.5 px-3 rounded-[4px] text-[12px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />Open Thread
            </a>
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Regenerate */}
        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Regenerate Reply
          </p>

          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="Add your angle or specific talking point… (optional)"
            rows={2}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] resize-none transition-all mb-2"
          />

          {regenError && (
            <div className="flex items-center gap-1.5 mb-2 text-[12px] text-[var(--red)]">
              <AlertCircle className="w-3.5 h-3.5" />{regenError}
            </div>
          )}

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full h-8 flex items-center justify-center gap-2 rounded-[4px] bg-[var(--accent)] text-white text-[13px] font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Regenerating…</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" />Regenerate Reply</>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
