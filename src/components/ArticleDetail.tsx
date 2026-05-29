"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  X,
  ExternalLink,
  Play,
  PenLine,
  BookmarkCheck,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import type { Article, SignalType } from "@/types";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
  onSaved?: () => void;
}

const SIGNAL_CONTEXT: Record<
  SignalType,
  { label: string; description: string; color: string }
> = {
  "pain-point": {
    label: "Competitor Weakness / Pain Point",
    description:
      "Users are frustrated with a competitor — this is an opportunity for Smallest AI to win them over",
    color: "bg-red-50 border-red-100 text-red-800",
  },
  "competitor-move": {
    label: "Competitor Move",
    description:
      "A competitor made a move (launch, partnership, funding) — evaluate if this changes our positioning",
    color: "bg-purple-50 border-purple-100 text-purple-800",
  },
  "lead-signal": {
    label: "Potential Lead",
    description:
      "A company is deploying or looking for voice AI — potential customer for Smallest AI",
    color: "bg-emerald-50 border-emerald-100 text-emerald-800",
  },
  "market-news": {
    label: "Market Intelligence",
    description:
      "Voice AI industry development — keep this on your radar for strategy",
    color: "bg-blue-50 border-blue-100 text-blue-800",
  },
  community: {
    label: "Community Discussion",
    description:
      "Voice AI community is talking about this — useful for content ideas and market pulse",
    color: "bg-amber-50 border-amber-100 text-amber-800",
  },
};

export default function ArticleDetail({
  article,
  onClose,
  onSaved,
}: ArticleDetailProps) {
  const { data: session } = useSession();
  const [logStatus, setLogStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [savedPlatform, setSavedPlatform] = useState("");

  const signal = article.signalType
    ? SIGNAL_CONTEXT[article.signalType]
    : SIGNAL_CONTEXT["market-news"];

  const handleSave = async (platform: string, status: string = "saved") => {
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
          keywordTag: article.category,
          status,
          platform,
          caption: "",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setLogStatus("success");
      setSavedPlatform(platform);
      onSaved?.();
      setTimeout(() => setLogStatus("idle"), 3000);
    } catch {
      setLogStatus("error");
      setTimeout(() => setLogStatus("idle"), 3000);
    }
  };

  return (
    <aside className="w-[380px] shrink-0 h-screen sticky top-0 flex flex-col bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {article.signalType && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${signal.color}`}
                >
                  {article.signalType === "pain-point"
                    ? "Pain Point"
                    : article.signalType === "competitor-move"
                      ? "Competitor"
                      : article.signalType === "lead-signal"
                        ? "Lead"
                        : article.signalType === "community"
                          ? "Community"
                          : "Market"}
                </span>
              )}
              {article.competitorName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white font-medium">
                  {article.competitorName}
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                {format(new Date(article.publishedAt), "MMM d, yyyy")}
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 leading-snug">
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
      </div>

      <div className="flex-1 px-5 py-5 space-y-5">
        {/* Summary */}
        {article.summary && (
          <div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Read full article */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[13px] text-gray-900 font-medium hover:underline"
        >
          Read full article
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Why this matters — signal-based context */}
        <div className={`rounded-lg p-3 border ${signal.color}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 opacity-80">
            Why this matters
          </p>
          <p className="text-[13px] font-medium">{signal.label}</p>
          <p className="text-[12px] mt-0.5 opacity-80">{signal.description}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Save Actions */}
        <div>
          <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Save to content pipeline
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleSave("youtube")}
              disabled={logStatus === "loading"}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-gray-400" />
              Save for YouTube
            </button>
            <button
              onClick={() => handleSave("blog")}
              disabled={logStatus === "loading"}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <PenLine className="w-4 h-4 text-gray-400" />
              Save for Blog
            </button>
            <button
              onClick={() => handleSave("", "saved")}
              disabled={logStatus === "loading"}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <BookmarkCheck className="w-4 h-4 text-gray-400" />
              Save for later
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={() => handleSave("", "skipped")}
              disabled={logStatus === "loading"}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 text-[13px] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Skip
            </button>
          </div>

          {logStatus === "success" && (
            <div className="flex items-center gap-1.5 mt-3 text-[12px] text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved{savedPlatform ? ` to ${savedPlatform}` : ""} successfully
            </div>
          )}
          {logStatus === "error" && (
            <div className="flex items-center gap-1.5 mt-3 text-[12px] text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to save. Check Google Sheets configuration.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
