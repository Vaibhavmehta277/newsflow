import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchLeadItems } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    const { items, isDemo } = await fetchLeadItems(forceRefresh);

    return NextResponse.json({
      items,
      total: items.length,
      hot: items.filter((i) => i.score >= 7).length,
      isDemo,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Leads fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
