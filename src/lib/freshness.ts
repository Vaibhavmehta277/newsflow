// ── Freshness badge utilities ──────────────────────────────────────────────

export interface FreshnessInfo {
  label: string;
  colorClass: string;
  ageHours: number;
}

export function getFreshnessInfo(publishedAt: string): FreshnessInfo {
  try {
    const age = Date.now() - new Date(publishedAt).getTime();
    const hours = age / (1000 * 60 * 60);

    if (hours < 1) {
      return {
        label: "🔴 Live",
        colorClass: "bg-red-500/15 text-red-300 border border-red-500/25",
        ageHours: hours,
      };
    }
    if (hours < 24) {
      return {
        label: "🟡 Recent",
        colorClass: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
        ageHours: hours,
      };
    }
    return {
      label: "⚪ Older",
      colorClass: "bg-zinc-800/50 text-zinc-500 border border-zinc-700/50",
      ageHours: hours,
    };
  } catch {
    return {
      label: "⚪ Older",
      colorClass: "bg-zinc-800/50 text-zinc-500 border border-zinc-700/50",
      ageHours: 999,
    };
  }
}

export function isWithin48Hours(publishedAt: string): boolean {
  try {
    const age = Date.now() - new Date(publishedAt).getTime();
    return age < 48 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function isWithin7Days(publishedAt: string): boolean {
  try {
    const age = Date.now() - new Date(publishedAt).getTime();
    return age < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** Color class for the platform source badge */
export function getPlatformBadgeClass(
  platform: "reddit" | "rss" | "hn" | "github" | "producthunt" | "youtube" | string
): string {
  switch (platform) {
    case "reddit":
      return "bg-orange-500/15 text-orange-400";
    case "hn":
      return "bg-amber-700/20 text-amber-400";
    case "github":
      return "bg-violet-500/15 text-violet-400";
    case "producthunt":
      return "bg-red-700/20 text-orange-300";
    case "youtube":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-zinc-800 text-zinc-500";
  }
}

export function getPlatformLabel(
  platform: "reddit" | "rss" | "hn" | "github" | "producthunt" | "youtube" | string
): string {
  switch (platform) {
    case "reddit": return "Reddit";
    case "hn": return "HN";
    case "github": return "GitHub";
    case "producthunt": return "PH";
    case "youtube": return "YouTube";
    default: return "RSS";
  }
}
