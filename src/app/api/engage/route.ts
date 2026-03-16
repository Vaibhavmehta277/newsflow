import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { fetchEngageItems } from "@/lib/engage";

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
    const { items, isDemo } = await fetchEngageItems(forceRefresh);

    return NextResponse.json({
      items,
      total: items.length,
      hot: items.filter((i) => i.tier === "hot").length,
      warm: items.filter((i) => i.tier === "warm").length,
      watching: items.filter((i) => i.tier === "watching").length,
      isDemo,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Engage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement opportunities" },
      { status: 500 }
    );
  }
}
