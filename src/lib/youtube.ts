import type { VideoItem } from "@/types";

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

// ── Keyword groups ────────────────────────────────────────────────────────────
// 30 keywords split into 3 named groups.
// Rotation strategy:
//   • GROUP_CORE  → fetched on EVERY refresh  (always fresh, highest signal)
//   • GROUP_B / GROUP_C → alternate daily (today's dayIndex % 2)
// Units per refresh: 10 (core) + 10 (rotating) = 20 searches × 100 = 2,000 units
// With 24 h cache → ≤ 2,000 units/day, comfortably under the 10,000 free quota.
// All 30 keywords cycle through within 2 days.

const GROUP_CORE = [
  "Voice AI",
  "AI Voice Agent",
  "Voice Bot",
  "AI Receptionist",
  "Virtual Receptionist",
  "AI Call Center",
  "AI Contact Center",
  "Outbound AI Calling",
  "AI Phone Agent",
  "Conversational AI Phone",
];

const GROUP_B = [
  "AI Calling Software",
  "Automate phone calls with AI",
  "AI appointment booking",
  "AI lead qualification calls",
  "After hours AI answering service",
  "AI customer support calls",
  "AI for healthcare calls",
  "AI for real estate calls",
  "AI for restaurants reservation automation",
  "AI recruitment calls",
];

const GROUP_C = [
  "AI for insurance calls",
  "Vapi AI",
  "Retell AI",
  "Bland AI",
  "Synthflow",
  "ElevenLabs voice",
  "Voice AI startup",
  "Conversational AI funding",
  "AI replacing receptionists",
  "AI phone calls 2026",
];

// Extra "bonus" trending terms — appended when quota allows (fetched on even days only)
const GROUP_TRENDING = [
  "Future of call centers AI",
  "AI agent calling",
  "Agentic AI voice",
];

/** Returns the keyword set to fetch on this particular day. */
function getTodaysKeywords(): string[] {
  // dayIndex changes every 24 h regardless of cache; groups rotate so all
  // keywords are covered within 2 days.
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % 2;
  const rotating = dayIndex === 0 ? GROUP_B : GROUP_C;
  // Trending terms are compact (3 keywords) — bolt them on at ~300 extra units
  // total still ≤ 2,300 units/day
  return [...GROUP_CORE, ...rotating, ...GROUP_TRENDING];
}

// ── In-memory cache (24 h) ────────────────────────────────────────────────────
let cachedVideos: VideoItem[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ── YouTube API helpers ───────────────────────────────────────────────────────

/** Search by keyword → video IDs (costs 100 units per call). */
async function searchVideoIds(keyword: string, apiKey: string): Promise<string[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: keyword,
    type: "video",
    maxResults: "6", // 6 per keyword × 23 keywords = 138 videos/day max
    relevanceLanguage: "en",
    order: "relevance",
    key: apiKey,
  });

  const res = await fetch(`${YT_API_BASE}/search?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YT search "${keyword}" → ${res.status}: ${body}`);
  }
  const data = await res.json();
  return (data.items ?? [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter((id: unknown): id is string => typeof id === "string");
}

/** Fetch snippet + statistics for up to 50 video IDs in one call (~1 unit). */
async function fetchVideoDetails(
  videoIds: string[],
  keyword: string,
  apiKey: string
): Promise<VideoItem[]> {
  if (videoIds.length === 0) return [];

  const params = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds.join(","),
    key: apiKey,
  });

  const res = await fetch(`${YT_API_BASE}/videos?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YT videos fetch → ${res.status}: ${body}`);
  }
  const data = await res.json();

  type RawItem = {
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      description: string;
      thumbnails: {
        maxres?: { url: string };
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
    statistics?: { viewCount?: string; likeCount?: string };
  };

  return (data.items ?? []).map((item: RawItem): VideoItem => ({
    id: item.id,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl:
      item.snippet.thumbnails.maxres?.url ??
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      "",
    description: (item.snippet.description ?? "").slice(0, 300),
    viewCount: parseInt(item.statistics?.viewCount ?? "0", 10),
    likeCount: item.statistics?.likeCount
      ? parseInt(item.statistics.likeCount, 10)
      : undefined,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    searchKeyword: keyword,
  }));
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchYouTubeVideos(forceRefresh = false): Promise<VideoItem[]> {
  const now = Date.now();

  // Serve from cache if still fresh
  if (!forceRefresh && cachedVideos.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedVideos;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[NewsFlow] YOUTUBE_API_KEY not set — YouTube section will be empty.");
    return [];
  }

  const keywords = getTodaysKeywords();
  const allVideos: VideoItem[] = [];
  const seenIds = new Set<string>();

  console.log(
    `[NewsFlow/YouTube] Fetching ${keywords.length} keywords ` +
    `(day-batch rotation, ~${keywords.length * 100} units)…`
  );

  // Sequential fetch: respect rate limits, log per-keyword failures without crashing
  for (const keyword of keywords) {
    try {
      const ids = await searchVideoIds(keyword, apiKey);
      const details = await fetchVideoDetails(ids, keyword, apiKey);
      for (const v of details) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          allVideos.push(v);
        }
      }
    } catch (err) {
      console.warn(`[NewsFlow/YouTube] Skipped "${keyword}":`, err);
    }
  }

  // Newest first
  allVideos.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  cachedVideos = allVideos;
  lastFetchTime = now;

  console.log(`[NewsFlow/YouTube] Cached ${allVideos.length} unique videos.`);
  return allVideos;
}

// ── Formatting helpers (used by VideoCard & VideoSidePanel) ───────────────────

export function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}
