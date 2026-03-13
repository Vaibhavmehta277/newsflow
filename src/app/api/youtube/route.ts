import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchYouTubeVideos } from "@/lib/youtube";

export const runtime = "nodejs";
// No ISR revalidate here — the lib handles its own 24 h in-memory cache

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  try {
    let videos = await fetchYouTubeVideos(forceRefresh);

    // Optional server-side search filter (client also filters, but belt-and-braces)
    if (search) {
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          v.channelName.toLowerCase().includes(search) ||
          v.description.toLowerCase().includes(search) ||
          v.searchKeyword.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      videos,
      total: videos.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube videos" },
      { status: 500 }
    );
  }
}
