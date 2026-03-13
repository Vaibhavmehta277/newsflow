import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GenerateCaptionsInput {
  title: string;
  summary: string;
  url: string;
  keywords: string[];
  comment?: string;
  platforms: ("linkedin" | "twitter" | "instagram")[];
}

interface GeneratedCaptions {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

export async function generateCaptions(
  input: GenerateCaptionsInput
): Promise<GeneratedCaptions> {
  const { title, summary, url, keywords, comment, platforms } = input;

  const keywordStr = keywords.slice(0, 5).join(", ");
  const commentSection = comment
    ? `\nTeam member's angle/comment: "${comment}"`
    : "";

  const platformInstructions = {
    linkedin: `LinkedIn Post (150-200 words):
- Professional tone, thought leadership angle
- Start with a hook (stat, question, or bold statement)
- 2-3 short paragraphs
- End with a call to action or question to drive comments
- Include 5-8 relevant hashtags at the end (on separate lines)
- No emojis unless they add clear value`,

    twitter: `Twitter/X Post (under 280 characters total including URL):
- Punchy, direct, opinionated
- One strong insight or hook
- 2-3 hashtags max
- Must be under 260 chars (leave room for URL)
- Include the URL at the end`,

    instagram: `Instagram Caption:
- Engaging opening line (hook)
- 3-5 sentences expanding on the topic
- Conversational and relatable tone
- End with a question to drive comments
- Then a line break and 20-25 niche hashtags as a block`,
  };

  const requestedInstructions = platforms
    .map((p, i) => `${i + 1}. ${platformInstructions[p]}`)
    .join("\n\n");

  const systemPrompt = `You are a social media content writer for Smallest AI, a Voice AI company that builds AI voice agents for businesses.
Your posts should position Smallest AI as a thought leader in the Voice AI space.
Write captions that are insightful, add value, and reflect expertise in conversational AI, voice automation, and AI-powered customer experience.`;

  const userPrompt = `Write social media captions for this article:

Title: ${title}
Summary: ${summary}
URL: ${url}
Keywords: ${keywordStr}${commentSection}

Generate captions for:
${requestedInstructions}

Format your response as JSON with keys: ${platforms.map((p) => `"${p}"`).join(", ")}
Only include the caption text as the value — no labels or extra formatting.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse captions from Claude response");
  }

  return JSON.parse(jsonMatch[0]) as GeneratedCaptions;
}
