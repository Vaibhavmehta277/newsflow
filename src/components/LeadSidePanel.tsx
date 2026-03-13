"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckCheck,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { LeadItem, LeadTriggerCategory } from "@/types";
import { getFreshnessInfo, getPlatformBadgeClass, getPlatformLabel } from "@/lib/freshness";
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

export default function LeadSidePanel({ item, onClose }: LeadSidePanelProps) {
  const { data: session } = useSession();
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set<PlatformKey>(["linkedin", "twitter"])
  );
  const [captions, setCaptions] = useState<Partial<Record<PlatformKey, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showCaptions, setShowCaptions] = useState(true);

  const cat = CATEGORY_CONFIG[item.triggerCategory];
  const freshness = getFreshnessInfo(item.publishedAt);
  const platformBadge = getPlatformBadgeClass(item.platform ?? "rss");
  const platformLabel = getPlatformLabel(item.platform ?? "rss");
  const isHot = item.score >= 7;

  const handleCopyOutreach = async () => {
    await navigator.clipboard.writeText(item.outreachDraft);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  const togglePlatform = (p: PlatformKey) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        if (next.size > 1) next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
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
    <aside className="w-[420px] shrink-0 h-screen sticky top-0 flex flex-col bg-[#111113] border-l border-zinc-800/60 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800/60 sticky top-0 bg-[#111113] z-10">
        <div className="flex-1 min-w-0 pr-3">
          {/* Category + Score row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cat.badge}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${SCORE_COLOR(item.score)}`}>
              {item.score}/10
            </span>
            {isHot && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                <Zap className="w-2.5 h-2.5" />
                HOT
              </span>
            )}
          </div>
          {/* Title */}
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug">{item.title}</h2>
          {/* Source + freshness row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${freshness.colorClass}`}>
              {freshness.label}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${platformBadge}`}>
              {platformLabel}
            </span>
            <span className="text-[11px] text-zinc-500">{item.source}</span>
            <span className="text-[11px] text-zinc-600">·</span>
            <span className="text-[11px] text-zinc-600">
              {format(new Date(item.publishedAt), "MMM d, h:mm a")}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0 mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Summary */}
        {item.summary && (
          <div>
            <p className="text-xs text-zinc-500 leading-relaxed">{item.summary}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-2 transition-colors"
            >
              View original post <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Trigger Phrases */}
        {item.triggerPhrases.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
              Trigger Signals
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.triggerPhrases.map((phrase) => (
                <span
                  key={phrase}
                  className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                >
                  &ldquo;{phrase}&rdquo;
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Outreach Draft */}
        {item.outreachDraft && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                Suggested Outreach
              </span>
              <button
                onClick={handleCopyOutreach}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-blue-300 border border-zinc-700 transition-colors"
              >
                {copiedOutreach ? (
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
              &ldquo;{item.outreachDraft}&rdquo;
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-zinc-800/60" />

        {/* Caption Generator */}
        <div>
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">
            Generate Captions
          </p>

          {/* Platform selector */}
          <div className="flex gap-2 mb-3">
            {PLATFORMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  selectedPlatforms.has(key)
                    ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Comment input */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your angle or talking point… (optional)"
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all"
          />

          {generateError && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {generateError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Captions
              </>
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
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                Generated Captions
              </p>
              {showCaptions ? (
                <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
              )}
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
        <div className="border-t border-zinc-800/60 pt-4">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogToSheets("", "", "saved")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-all disabled:opacity-50"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save to Sheets
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Source
            </a>
          </div>

          {/* Log status */}
          {logStatus === "success" && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logged to Google Sheets
            </div>
          )}
          {logStatus === "error" && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to log. Check Sheets config.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
