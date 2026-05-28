"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  BookmarkCheck,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Article } from "@/types";
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
  const [captions, setCaptions] = useState<Partial<Record<PlatformKey, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

  return (
    <aside className="w-[400px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {article.category.replace("-", " ")}
            </span>
            <span className="text-[12px] text-gray-400">
              {format(new Date(article.publishedAt), "MMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-[14px] font-semibold text-gray-900 leading-snug">
            {article.title}
          </h2>
          <p className="text-[12px] text-gray-500 mt-1">{article.source}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {article.summary && (
          <div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              {article.summary}
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-gray-900 font-medium hover:underline mt-2"
            >
              Read full article <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {article.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.keywords.map((kw) => (
              <span
                key={kw}
                className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100" />

        <div>
          <p className="text-[12px] font-medium text-gray-900 mb-3">
            Generate Captions
          </p>

          <div className="flex gap-2 mb-3">
            {PLATFORMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedPlatforms.has(key)
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your angle or talking point... (optional)"
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white resize-none transition-colors"
          />

          {generateError && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              {generateError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {Object.keys(captions).length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-gray-900 mb-3">
              Generated Captions
            </p>
            <CaptionDisplay
              captions={captions}
              onLogToSheets={(platform, caption) =>
                handleLogToSheets(platform, caption, "posted")
              }
            />
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogToSheets("", "", "saved")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-[12px] font-medium hover:bg-gray-50 transition-colors"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={() => handleLogToSheets("", "", "skipped")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-400 text-[12px] font-medium hover:bg-gray-50 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>

          {logStatus === "success" && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logged to Google Sheets
            </div>
          )}
          {logStatus === "error" && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to log. Check Sheets config.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
