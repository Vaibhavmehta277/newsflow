"use client";

import { formatDistanceToNow } from "date-fns";
import { Eye, ChevronRight, Play } from "lucide-react";
import type { VideoItem } from "@/types";
import { formatViewCount } from "@/lib/youtube";

interface VideoCardProps {
  video: VideoItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function VideoCard({ video, isSelected, onClick }: VideoCardProps) {
  const timeAgo = formatDistanceToNow(new Date(video.publishedAt), {
    addSuffix: true,
  });

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[6px] border cursor-pointer transition-all duration-150 overflow-hidden ${
        isSelected
          ? "bg-[var(--bg-elevated)] border-[var(--accent-border)] ring-1 ring-[var(--accent-border)]"
          : "bg-[var(--bg-surface)] border-[var(--border)] hover:bg-[var(--bg-hover)] hover:border-[var(--border)]"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[var(--bg-surface)] overflow-hidden">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
            <Play className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* YouTube badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-red-600 text-white font-medium">
            YouTube
          </span>
        </div>

        {/* Keyword tag */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-black/60 text-zinc-300 backdrop-blur-sm border border-white/10">
            {video.searchKeyword}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5">
        {/* Title */}
        <h3
          className={`text-sm font-medium leading-snug mb-2 line-clamp-2 transition-colors ${
            isSelected ? "text-white" : "text-[var(--text-primary)] group-hover:text-white"
          }`}
        >
          {video.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate max-w-[140px]">
              {video.channelName}
            </span>
            <span className="text-[var(--text-muted)] text-[10px]">·</span>
            <span className="text-[11px] text-[var(--text-muted)]">{timeAgo}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {video.viewCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Eye className="w-3 h-3" />
                {formatViewCount(video.viewCount)}
              </span>
            )}
            <ChevronRight
              className={`w-3.5 h-3.5 transition-all ${
                isSelected
                  ? "text-[var(--accent)] translate-x-0.5"
                  : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
              }`}
            />
          </div>
        </div>

        {/* Description snippet */}
        {video.description && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
