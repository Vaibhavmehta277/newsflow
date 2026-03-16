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
    <aside className="w-[420px] shrink-0 h-screen sticky top-0 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-surface)] z-10">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-[4px] border font-medium bg-red-500/15 text-red-300 border-red-500/30">
              YouTube
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {format(new Date(video.publishedAt), "MMM d, yyyy")}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-3">
            {video.title}
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{video.channelName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-5">

        {/* Embedded player */}
        <div className="rounded-[6px] overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
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
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <Eye className="w-3.5 h-3.5" />
              <span>{formatViewCount(video.viewCount)} views</span>
            </div>
          )}
          {video.likeCount !== undefined && video.likeCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
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
            <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Description
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {video.description}
              {video.description.length >= 300 && "…"}
            </p>
          </div>
        )}

        {/* Keyword tag */}
        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Discovered via
          </p>
          <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
            {video.searchKeyword}
          </span>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Caption Generator */}
        <div>
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Generate Captions
          </p>

          <div className="flex gap-2 mb-3">
            {PLATFORMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => togglePlatform(key)}
                className={`text-[11px] px-2.5 py-1 rounded-[4px] border transition-all ${
                  selectedPlatforms.has(key)
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]"
                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your angle, key takeaway, or talking point… (optional)"
            rows={3}
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-[6px] px-3 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] resize-none transition-all"
          />

          {generateError && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--red)]">
              <AlertCircle className="w-3.5 h-3.5" />
              {generateError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] bg-[var(--accent)] hover:opacity-90 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Generated Captions
              </p>
              {showCaptions ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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

        {/* Actions */}
        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLogToSheets("", "", "saved")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium transition-all"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              Save to Sheet
            </button>
            <button
              onClick={() => handleLogToSheets("", "", "skipped")}
              disabled={logStatus === "loading"}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-medium transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>

          {logStatus === "success" && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--green)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logged to Google Sheets
            </div>
          )}
          {logStatus === "error" && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--red)]">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to log. Check Sheets config.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
