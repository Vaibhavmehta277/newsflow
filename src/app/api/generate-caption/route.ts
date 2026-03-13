import { NextRequest, NextResponse } from "next/server";
import { generateCaptions } from "@/lib/claude";
import { getServerSession } from "next-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, summary, url, keywords, comment, platforms } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "title and url are required" },
        { status: 400 }
      );
    }

    const captions = await generateCaptions({
      title,
      summary: summary || "",
      url,
      keywords: keywords || [],
      comment,
      platforms: platforms || ["linkedin", "twitter", "instagram"],
    });

    return NextResponse.json({ captions });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions" },
      { status: 500 }
    );
  }
}
