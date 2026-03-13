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
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Article } from "@/types";
import { CATEGORY_META } from "@/lib/keywords";
import CaptionDisplay from "./CaptionDisplay";

interface ArticleSidePanelProps {
  article: Article;
  onClose: () => void;
}

type PlatformKey = "linkedin" | "twitter" | "instagram";

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter/X" },
  { key: "instagram", label: "Instagram" },
];

export default function ArticleSidePanel({
  article,
  onClose,
}: ArticleSidePanelProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set<PlatformKey>(["linkedin", "twitter"])
  );
  const [captions, setCaptions] = useState<
    Partial<Record<PlatformKey, string>>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [logStatus, setLogStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [showCaptions, setShowCaptions] = useState(true);

  const meta = CATEGORY_META[article.category] || CATEGORY_META["ai-news"];

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
          title: article.title,
          summary: article.summary,
          url: article.url,
          keywords: article.keywords,
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

  const handleLogToSheets = async (
    platform: string,
    caption: string,
    status = "saved"
  ) => {
    if (!session) return;
    setLogStatus("loading");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          source: article.source,
          url: article.url,
          keywordTag: article.keywords,
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

  const handleSaveArticle = () => {
    handleLogToSheets("", "", "saved");
  };

  const handleMarkPosted = (platform: string, caption: string) => {
    handleLogToSheets(platform, caption, "posted");
  };

  return (
    <aside className="w-[420px] shrink-0 h-screen sticky top-0 flex flex-col bg-[#111113] border-l border-zinc-800/60 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800/60 sticky top-0 bg-[#111113] z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.bgColor}`}
            >
              {meta.label}
            </span>
            <span className="text-[11px] text-zinc-600">
              {format(new Date(article.publishedAt), "MMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug">
            {article.title}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">{article.source}</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Summary */}
        {article.summary && (
          <div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {article.summary}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-2 transition-colors"
            >
              Read full article <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Keywords */}
        {article.keywords.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
              Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {article.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                >
                  {kw}
                </span>
              ))}
            </div>
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
            placeholder="Add your angle, insight, or talking point... (optional)"
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
                Generating...
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
                onLogToSheets={(platform, caption) =>
                  handleMarkPosted(platform, caption)
                }
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
              onClick={handleSaveArticle}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-all"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save to Sheet
            </button>
            <button
              onClick={() => handleLogToSheets("", "", "skipped")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-500 text-xs font-medium transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              Skip
            </button>
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
