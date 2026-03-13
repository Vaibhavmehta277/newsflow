import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import type { ArticleCategory } from "@/types";

export const runtime = "nodejs";
export const revalidate = 900; // 15 min

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as ArticleCategory | null;
  const search = searchParams.get("search")?.toLowerCase() || "";
  const refresh = searchParams.get("refresh") === "true";
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    let articles = await fetchAllFeeds(refresh);

    if (category && category !== ("all" as ArticleCategory)) {
      articles = articles.filter((a) => a.category === category);
    }

    if (search) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.summary.toLowerCase().includes(search) ||
          a.keywords.some((k) => k.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      articles: articles.slice(0, limit),
      total: articles.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feeds" },
      { status: 500 }
    );
  }
}
