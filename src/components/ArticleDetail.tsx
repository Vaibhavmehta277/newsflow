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
import type { Article } from "@/types";
import { CATEGORY_LABELS } from "@/lib/keywords";

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
  onSaved?: () => void;
}

const RELEVANCE_MAP: Record<string, { label: string; description: string }> = {
  "voice-ai": {
    label: "Core Technology",
    description: "Directly related to voice AI technology and products",
  },
  "use-case": {
    label: "Market Opportunity",
    description: "Potential use case or industry adopting voice AI",
  },
  "market-intel": {
    label: "Competitor Activity",
    description: "Competitor or market movement worth tracking",
  },
  cx: {
    label: "Customer Experience",
    description: "Contact center and CX automation trends",
  },
  "ai-news": {
    label: "Industry News",
    description: "Broader AI industry development",
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

  const relevance = RELEVANCE_MAP[article.category] || RELEVANCE_MAP["ai-news"];

  const handleSave = async (
    platform: string,
    status: string = "saved"
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
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {CATEGORY_LABELS[article.category] || article.category}
              </span>
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

        {/* Relevance tag */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Why this matters
          </p>
          <p className="text-[13px] text-gray-700 font-medium">
            {relevance.label}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {relevance.description}
          </p>
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
