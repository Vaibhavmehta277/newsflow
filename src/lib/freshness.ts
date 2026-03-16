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
        label: "Live",
        colorClass: "bg-[var(--red-subtle)] text-[var(--red)] border border-[var(--red)]",
        ageHours: hours,
      };
    }
    if (hours < 24) {
      return {
        label: "Recent",
        colorClass: "bg-[var(--amber-subtle)] text-[var(--amber)] border border-[var(--amber)]",
        ageHours: hours,
      };
    }
    return {
      label: "Older",
      colorClass: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]",
      ageHours: hours,
    };
  } catch {
    return {
      label: "Older",
      colorClass: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]",
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
      return "bg-[var(--amber-subtle)] text-[var(--amber)]";
    case "hn":
      return "bg-[var(--amber-subtle)] text-[var(--amber)]";
    case "github":
      return "bg-[var(--accent-subtle)] text-[var(--accent)]";
    case "producthunt":
      return "bg-[var(--red-subtle)] text-[var(--red)]";
    case "youtube":
      return "bg-[var(--red-subtle)] text-[var(--red)]";
    default:
      return "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
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
