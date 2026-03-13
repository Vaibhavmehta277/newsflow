"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Twitter, Instagram } from "lucide-react";

interface CaptionDisplayProps {
  captions: Partial<Record<"linkedin" | "twitter" | "instagram", string>>;
  onLogToSheets?: (platform: string, caption: string) => void;
}

const PLATFORM_META = {
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    charLimit: null,
  },
  twitter: {
    label: "Twitter / X",
    icon: Twitter,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
    charLimit: 280,
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/30",
    charLimit: null,
  },
};

function CaptionPanel({
  platform,
  content,
  onLog,
}: {
  platform: "linkedin" | "twitter" | "instagram";
  content: string;
  onLog?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform];
  const Icon = meta.icon;
  const charCount = content.length;
  const isOverLimit = meta.charLimit ? charCount > meta.charLimit : false;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-4 ${meta.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className={`text-sm font-medium ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {meta.charLimit && (
            <span
              className={`text-[11px] font-mono ${
                isOverLimit ? "text-red-400" : "text-zinc-500"
              }`}
            >
              {charCount}/{meta.charLimit}
            </span>
          )}
          {onLog && (
            <button
              onClick={onLog}
              className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            >
              Log
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
        {content}
      </pre>
    </div>
  );
}

export default function CaptionDisplay({
  captions,
  onLogToSheets,
}: CaptionDisplayProps) {
  const platforms = (
    ["linkedin", "twitter", "instagram"] as const
  ).filter((p) => captions[p]);

  if (platforms.length === 0) return null;

  return (
    <div className="space-y-3">
      {platforms.map((platform) => (
        <CaptionPanel
          key={platform}
          platform={platform}
          content={captions[platform]!}
          onLog={
            onLogToSheets
              ? () => onLogToSheets(platform, captions[platform]!)
              : undefined
          }
        />
      ))}
    </div>
  );
}
