import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, snippet, url, topicTag, angle, userNote } = body as {
      title: string;
      snippet: string;
      url: string;
      topicTag: string;
      angle: string;
      userNote?: string;
    };

    if (!title || !snippet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = `You are a community engagement expert for Smallest AI, a Voice AI platform. 
Write a genuine, insightful public comment for a social media thread. 
The comment should add real value, sound like a knowledgeable practitioner, and only mention Smallest AI if it flows naturally.
Keep it 2-4 sentences. No promotional language. No fluff. No hashtags.`;

    const userPrompt = `Thread title: ${title}
Thread context: ${snippet}
Thread URL: ${url}
Topic: ${topicTag}
Engagement angle: ${angle}
${userNote ? `Additional note from team: ${userNote}` : ""}

Write an improved public comment draft that adds genuine value to this thread.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Engage reply generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
