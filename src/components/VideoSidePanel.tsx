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
  Eye,
  ThumbsUp,
} from "lucide-react";
import { format } from "date-fns";
import type { VideoItem } from "@/types";
import { formatViewCount } from "@/lib/youtube";
import CaptionDisplay from "./CaptionDisplay";

interface VideoSidePanelProps {
  video: VideoItem;
  onClose: () => void;
}

type PlatformKey = "linkedin" | "twitter" | "instagram";

const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter/X" },
  { key: "instagram", label: "Instagram" },
];

export default function VideoSidePanel({ video, onClose }: VideoSidePanelProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set<PlatformKey>(["linkedin", "twitter"])
  );
  const [captions, setCaptions] = useState<Partial<Record<PlatformKey, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [logStatus, setLogStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showCaptions, setShowCaptions] = useState(true);

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
          title: video.title,
          // Pass description + channel as context for the caption
          summary: `${video.description} (by ${video.channelName} on YouTube)`,
          url: video.url,
          keywords: [video.searchKeyword, "voice ai", "youtube"],
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
          title: video.title,
          source: `YouTube — ${video.channelName}`,
          url: video.url,
          keywordTag: [video.searchKeyword, "youtube"],
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800/60 sticky top-0 bg-[#111113] z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-red-500/15 text-red-300 border-red-500/30">
              YouTube
            </span>
            <span className="text-[11px] text-zinc-600">
              {format(new Date(video.publishedAt), "MMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-3">
            {video.title}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">{video.channelName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-5 py-4 space-y-5">

        {/* Embedded player */}
        <div className="rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-900">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          {video.viewCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatViewCount(video.viewCount)} views</span>
            </div>
          )}
          {video.likeCount !== undefined && video.likeCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{formatViewCount(video.likeCount)} likes</span>
            </div>
          )}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
          >
            Watch on YouTube <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Description */}
        {video.description && (
          <div>
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
              Description
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {video.description}
              {video.description.length >= 300 && "…"}
            </p>
          </div>
        )}

        {/* Keyword tag */}
        <div>
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-2">
            Discovered via
          </p>
          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {video.searchKeyword}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800/60" />

        {/* ── Caption Generator ─────────────────────────────────────────────── */}
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

          {/* Comment / angle input */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your angle, key takeaway, or talking point… (optional)"
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

        {/* ── Generated Captions ───────────────────────────────────────────── */}
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
                  handleLogToSheets(platform, caption, "posted")
                }
              />
            )}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800/60 pt-4">
          <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-3">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogToSheets("", "", "saved")}
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
