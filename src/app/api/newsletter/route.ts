import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateNewsletter, getNewsletterHistory } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = getNewsletterHistory();
  return NextResponse.json({ newsletters: history });
}

export async function POST() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newsletter = await generateNewsletter();
    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error("Newsletter generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate newsletter" },
      { status: 500 }
    );
  }
}
