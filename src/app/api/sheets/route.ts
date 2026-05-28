import { NextRequest, NextResponse } from "next/server";
import { appendSheetRow, getRecentRows, ensureSheetHeaders } from "@/lib/sheets";
import { getServerSession } from "next-auth";
import type { SheetRow } from "@/types";
import { format } from "date-fns";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, source, url, keywordTag, status, platform, caption } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "title and url are required" },
        { status: 400 }
      );
    }

    const userName = session.user?.name || "Unknown";

    const row: SheetRow = {
      date: format(new Date(), "yyyy-MM-dd HH:mm"),
      title,
      source: source || "",
      url,
      keywordTag: Array.isArray(keywordTag) ? keywordTag.join(", ") : keywordTag || "",
      assignedTo: userName,
      status: status || "saved",
      platform: platform || "",
      caption: caption || "",
      postedBy: status === "posted" ? userName : "",
    };

    await ensureSheetHeaders();
    await appendSheetRow(row);

    return NextResponse.json({ success: true, row });
  } catch (error) {
    console.error("Sheets API error:", error);
    return NextResponse.json(
      { error: "Failed to log to Google Sheets" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await getRecentRows(100);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Sheets GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Google Sheets" },
      { status: 500 }
    );
  }
}
