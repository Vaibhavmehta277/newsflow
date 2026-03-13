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
      className={`group relative rounded-xl border cursor-pointer transition-all duration-150 overflow-hidden ${
        isSelected
          ? "bg-zinc-800/80 border-red-500/40 ring-1 ring-red-500/20"
          : "bg-zinc-900/50 border-zinc-800/60 hover:bg-zinc-800/50 hover:border-zinc-700/60"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <Play className="w-8 h-8 text-zinc-600" />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* YouTube badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-medium">
            YouTube
          </span>
        </div>

        {/* Keyword tag */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 backdrop-blur-sm border border-white/10">
            {video.searchKeyword}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5">
        {/* Title */}
        <h3
          className={`text-sm font-medium leading-snug mb-2 line-clamp-2 transition-colors ${
            isSelected ? "text-white" : "text-zinc-100 group-hover:text-white"
          }`}
        >
          {video.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* Channel */}
            <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[140px]">
              {video.channelName}
            </span>
            <span className="text-zinc-700 text-[10px]">·</span>
            <span className="text-[11px] text-zinc-600">{timeAgo}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View count */}
            {video.viewCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Eye className="w-3 h-3" />
                {formatViewCount(video.viewCount)}
              </span>
            )}
            <ChevronRight
              className={`w-3.5 h-3.5 transition-all ${
                isSelected
                  ? "text-red-400 translate-x-0.5"
                  : "text-zinc-700 group-hover:text-zinc-500"
              }`}
            />
          </div>
        </div>

        {/* Description snippet */}
        {video.description && (
          <p className="text-[11px] text-zinc-600 leading-relaxed line-clamp-2 mt-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
