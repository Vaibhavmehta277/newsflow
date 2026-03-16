"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  ExternalLink,
  Sparkles,
  Loader2,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { LeadItem, LeadTriggerCategory } from "@/types";
import { getPlatformLabel } from "@/lib/freshness";
import CaptionDisplay from "./CaptionDisplay";

interface LeadSidePanelProps {
  item: LeadItem;
  onClose: () => void;
}

type PlatformKey = "linkedin" | "twitter" | "instagram";

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter/X" },
  { key: "instagram", label: "Instagram" },
];

const CATEGORY_CONFIG: Record<LeadTriggerCategory, { label: string; textColor: string }> = {
  "pain-point":            { label: "Pain Point",           textColor: "text-[var(--red)]" },
  "solution-seeking":      { label: "Solution Seeking",     textColor: "text-[var(--accent)]" },
  "competitor-comparison": { label: "Competitor Comparison",textColor: "text-[var(--amber)]" },
  "industry-specific":     { label: "Industry Signal",      textColor: "text-[var(--text-secondary)]" },
};

export default function LeadSidePanel({ item, onClose }: LeadSidePanelProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set<PlatformKey>(["linkedin", "twitter"])
  );
  const [captions, setCaptions] = useState<Partial<Record<PlatformKey, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const cat = CATEGORY_CONFIG[item.triggerCategory];
  const platformLabel = getPlatformLabel(item.platform ?? "rss");
  const isHot = item.score >= 7;

  const togglePlatform = (p: PlatformKey) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) { if (next.size > 1) next.delete(p); }
      else next.add(p);
      return next;
    });
  };

  const handleCopyOutreach = async () => {
    await navigator.clipboard.writeText(item.outreachDraft);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          summary: item.summary,
          url: item.url,
          keywords: item.triggerPhrases,
          comment: comment.trim() || undefined,
          platforms: Array.from(selectedPlatforms),
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { captions: generated } = await res.json();
      setCaptions(generated);
      setShowCaptions(true);
    } catch {
      setGenerateError("Failed to generate captions. Check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogToSheets = async (platform: string, caption: string, status = "saved") => {
    if (!session) return;
    setLogStatus("loading");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          source: item.source,
          url: item.url,
          keywordTag: item.triggerPhrases,
          status,
          platform,
          caption,
        }),
      });
      if (!res.ok) throw new Error("Sheet log failed");
      setLogStatus("success");
      setTimeout(() => setLogStatus("idle"), 3000);
    } catch {
      setLogStatus("error");
      setTimeout(() => setLogStatus("idle"), 3000);
    }
  };

  return (
    <aside className="w-[420px] shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-medium ${cat.textColor}`}>{cat.label}</span>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] text-[var(--text-muted)]">{item.score}/10</span>
            {isHot && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[var(--red-subtle)] text-[var(--red)] font-medium">
                Hot
              </span>
            )}
          </div>
          <h2 className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">
            {item.title}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
            {platformLabel} · {item.source} · {format(new Date(item.publishedAt), "MMM d, h:mm a")}
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
        {/* Summary */}
        {item.summary && (
          <div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{item.summary}</p>
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

        {/* Trigger phrases */}
        {item.triggerPhrases.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.triggerPhrases.map((phrase) => (
              <span
                key={phrase}
                className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
              >
                &ldquo;{phrase}&rdquo;
              </span>
            ))}
          </div>
        )}

        {/* Outreach draft — quiet box */}
        {item.outreachDraft && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[4px] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                Suggested Outreach
              </p>
              <button
                onClick={handleCopyOutreach}
                className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {copiedOutreach ? (
                  <><CheckCheck className="w-3 h-3 text-[var(--green)]" /><span className="text-[var(--green)]">Copied</span></>
                ) : (
                  <><Copy className="w-3 h-3" />Copy</>
                )}
              </button>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              {item.outreachDraft}
            </p>
          </div>
        )}

        <div className="border-t border-[var(--border)]" />

        {/* Caption Generator */}
        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Generate Captions
          </p>

          <div className="flex gap-2 mb-3">
            {PLATFORMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`text-[12px] px-2.5 py-1 rounded-[4px] border transition-all ${
                  selectedPlatforms.has(key)
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]"
                    : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your angle or talking point… (optional)"
            rows={3}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[4px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] resize-none transition-all"
          />

          {generateError && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[var(--red)]">
              <AlertCircle className="w-3.5 h-3.5" />
              {generateError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-3 h-8 flex items-center justify-center gap-2 rounded-[4px] bg-[var(--accent)] text-white text-[13px] font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" />Generate Captions</>
            )}
          </button>
        </div>

        {/* Generated Captions */}
        {Object.keys(captions).length > 0 && (
          <div>
            <button
              onClick={() => setShowCaptions((v) => !v)}
              className="flex items-center justify-between w-full mb-3"
            >
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em]">
                Generated Captions
              </p>
              {showCaptions
                ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
            </button>
            {showCaptions && (
              <CaptionDisplay
                captions={captions}
                onLogToSheets={(platform, caption) => handleLogToSheets(platform, caption, "posted")}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.07em] mb-3">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogToSheets("", "", "saved")}
              disabled={logStatus === "loading"}
              className="h-[30px] flex items-center justify-center gap-1.5 rounded-[4px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] transition-all disabled:opacity-50"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save to Sheets
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[30px] flex items-center justify-center gap-1.5 rounded-[4px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Thread
            </a>
          </div>

          {logStatus === "success" && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[var(--green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />Logged to Google Sheets
            </div>
          )}
          {logStatus === "error" && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[var(--red)]">
              <AlertCircle className="w-3.5 h-3.5" />Failed to log. Check Sheets config.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
