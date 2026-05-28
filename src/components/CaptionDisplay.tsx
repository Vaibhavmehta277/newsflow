"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CaptionDisplayProps {
  captions: Partial<Record<"linkedin" | "twitter" | "instagram", string>>;
  onLogToSheets?: (platform: string, caption: string) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  instagram: "Instagram",
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
  const charLimit = platform === "twitter" ? 280 : null;
  const isOverLimit = charLimit ? content.length > charLimit : false;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-gray-900">
          {PLATFORM_LABELS[platform]}
        </span>
        <div className="flex items-center gap-2">
          {charLimit && (
            <span className={`text-[11px] font-mono ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
              {content.length}/{charLimit}
            </span>
          )}
          {onLog && (
            <button
              onClick={onLog}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Log
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Copied</span>
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
      <pre className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">
        {content}
      </pre>
    </div>
  );
}

export default function CaptionDisplay({
  captions,
  onLogToSheets,
}: CaptionDisplayProps) {
  const platforms = (["linkedin", "twitter", "instagram"] as const).filter(
    (p) => captions[p]
  );

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
