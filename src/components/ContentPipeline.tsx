"use client";

import {
  Play,
  PenLine,
  FileEdit,
  ExternalLink,
  Clock,
  Inbox,
} from "lucide-react";
import type { SheetRow } from "@/types";

interface ContentPipelineProps {
  rows: SheetRow[];
  type: "youtube" | "blogs" | "edits";
  loading: boolean;
}

const CONFIG = {
  youtube: {
    title: "YouTube",
    subtitle: "Video content pipeline from saved articles",
    icon: Play,
    emptyTitle: "No YouTube content yet",
    emptyDescription:
      "When you find an interesting article, click it and choose 'Save for YouTube' to add it here.",
  },
  blogs: {
    title: "Blogs",
    subtitle: "Blog content pipeline from saved articles",
    icon: PenLine,
    emptyTitle: "No blog content yet",
    emptyDescription:
      "When you find an interesting article, click it and choose 'Save for Blog' to add it here.",
  },
  edits: {
    title: "Edits",
    subtitle: "Saved articles waiting for review",
    icon: FileEdit,
    emptyTitle: "No saved articles yet",
    emptyDescription:
      "Browse the Feed, Lead Alerts, or Competitor Watch and save articles to review them here.",
  },
};

export default function ContentPipeline({
  rows,
  type,
  loading,
}: ContentPipelineProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  if (loading) {
    return (
      <div className="p-6 max-w-[900px]">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-48 bg-gray-50 rounded animate-pulse mt-2" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-1/3 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {config.title}
          </h1>
          <p className="text-[13px] text-gray-500">{config.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl">
          <div className="p-3 rounded-full bg-gray-50 mb-3">
            <Inbox className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-[14px] font-medium text-gray-700 mb-1">
            {config.emptyTitle}
          </p>
          <p className="text-[13px] text-gray-400 max-w-sm text-center">
            {config.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-900 leading-snug">
                    {row.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[12px] text-gray-500">
                      {row.source}
                    </span>
                    {row.assignedTo && (
                      <>
                        <span className="text-[12px] text-gray-300">
                          &middot;
                        </span>
                        <span className="text-[12px] text-gray-500">
                          {row.assignedTo}
                        </span>
                      </>
                    )}
                    <span className="text-[12px] text-gray-300">&middot;</span>
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      {row.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      row.status === "posted"
                        ? "text-green-700 bg-green-50"
                        : row.status === "skipped"
                        ? "text-gray-400 bg-gray-50"
                        : "text-gray-600 bg-gray-100"
                    }`}
                  >
                    {row.status}
                  </span>
                  {row.url && (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
