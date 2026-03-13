import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { format, startOfWeek } from "date-fns";
import { fetchAllFeeds } from "./rss";
import { fetchYouTubeVideos } from "./youtube";
import { fetchIntelItems } from "./intel";
import { fetchLeadItems } from "./leads";
import type {
  Newsletter,
  NewsletterArticle,
  NewsletterVideo,
  NewsletterCompetitorWatch,
} from "@/types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ── In-memory newsletter history (last 12 newsletters) ─────────────────────
const MAX_HISTORY = 12;
export const newsletterHistory: Newsletter[] = [];

// ── Content gathering ───────────────────────────────────────────────────────

async function gatherContent(): Promise<{
  articles: NewsletterArticle[];
  videos: NewsletterVideo[];
  competitors: NewsletterCompetitorWatch[];
  marketSignal: string;
}> {
  // Fetch everything in parallel (using cached data where available)
  const [allArticles, allVideos, allIntel, allLeads] = await Promise.allSettled([
    fetchAllFeeds(),
    fetchYouTubeVideos(),
    fetchIntelItems(),
    fetchLeadItems(),
  ]);

  // Top 5 articles: prefer voice-ai category, then by recency
  const articles =
    allArticles.status === "fulfilled" ? allArticles.value : [];
  const sortedArticles = [...articles].sort((a, b) => {
    if (a.category === "voice-ai" && b.category !== "voice-ai") return -1;
    if (b.category === "voice-ai" && a.category !== "voice-ai") return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  const topArticles: NewsletterArticle[] = sortedArticles
    .slice(0, 5)
    .map((a) => ({
      title: a.title,
      source: a.source,
      url: a.url,
      summary: a.summary.slice(0, 200),
    }));

  // Top 3 YouTube videos
  const videos = allVideos.status === "fulfilled" ? allVideos.value : [];
  const topVideos: NewsletterVideo[] = videos.slice(0, 3).map((v) => ({
    title: v.title,
    channel: v.channelName,
    url: v.url,
    summary: v.description.slice(0, 150),
  }));

  // Top 2 competitor intel items
  const intelResult = allIntel.status === "fulfilled" ? allIntel.value : { items: [] };
  const intel = intelResult.items;
  const topIntel: NewsletterCompetitorWatch[] = intel.slice(0, 2).map((i) => ({
    competitor: i.competitor,
    insight: i.summary.slice(0, 150),
    opportunity: i.opportunityNote,
  }));

  // Top lead signal as market signal
  const leadsResult = allLeads.status === "fulfilled" ? allLeads.value : { items: [] };
  const leads = leadsResult.items;
  const topLead = leads[0];
  const marketSignal = topLead
    ? `${topLead.title} — potential buyer signal from ${topLead.source}`
    : "Monitor voice AI adoption trends this week for emerging opportunities.";

  return {
    articles: topArticles,
    videos: topVideos,
    competitors: topIntel,
    marketSignal,
  };
}

// ── OpenAI newsletter generation ───────────────────────────────────────────

interface GeneratedSections {
  subject: string;
  previewText: string;
  intro: string;
  articleSummaries: string[];
  videoSummaries: string[];
  competitorCommentary: string[];
  marketSignalExpanded: string;
  cta: string;
}

async function generateNewsletterSections(
  content: Awaited<ReturnType<typeof gatherContent>>,
  weekOf: string
): Promise<GeneratedSections> {
  const articlesBlock = content.articles
    .map((a, i) => `${i + 1}. "${a.title}" (${a.source}) — ${a.summary}`)
    .join("\n");

  const videosBlock = content.videos
    .map((v, i) => `${i + 1}. "${v.title}" by ${v.channel} — ${v.summary}`)
    .join("\n");

  const competitorsBlock = content.competitors
    .map(
      (c, i) =>
        `${i + 1}. ${c.competitor}: ${c.insight} | Opportunity: ${c.opportunity}`
    )
    .join("\n");

  const systemPrompt = `You are a content strategist for Smallest AI, a Voice AI company.
Write a weekly newsletter for the Voice AI industry that positions Smallest AI as a thought leader.
Tone: Professional but conversational. Forward-thinking. Data-driven where possible.`;

  const userPrompt = `Generate a weekly Voice AI industry newsletter for the week of ${weekOf}.

Content to work with:

TOP ARTICLES THIS WEEK:
${articlesBlock || "No articles available"}

TOP YOUTUBE VIDEOS:
${videosBlock || "No videos available"}

COMPETITOR INTELLIGENCE:
${competitorsBlock || "No competitor intel available"}

MARKET SIGNAL:
${content.marketSignal}

Generate the following newsletter sections as JSON:
{
  "subject": "Compelling email subject line (max 60 chars)",
  "previewText": "Email preview text (max 90 chars)",
  "intro": "Opening paragraph (2-3 sentences, engaging hook about this week in Voice AI)",
  "articleSummaries": ["1-sentence summary for each article", ...],
  "videoSummaries": ["1-sentence why-watch summary for each video", ...],
  "competitorCommentary": ["1-sentence commentary for each competitor intel item", ...],
  "marketSignalExpanded": "2-3 sentences expanding on the market signal and what it means for teams selling voice AI",
  "cta": "Closing call-to-action sentence (link to Smallest AI demo or contact)"
}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const responseText = completion.choices[0]?.message?.content ?? "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse newsletter sections from OpenAI");
  }

  return JSON.parse(jsonMatch[0]) as GeneratedSections;
}

// ── HTML template ──────────────────────────────────────────────────────────

function buildHtml(
  content: Awaited<ReturnType<typeof gatherContent>>,
  sections: GeneratedSections,
  weekOf: string
): string {
  const articleRows = content.articles
    .map(
      (a, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
        <p style="margin:0 0 4px 0; font-size:14px; font-weight:600; color:#e4e4e7;">
          <a href="${a.url}" style="color:#8b5cf6; text-decoration:none;">${a.title}</a>
        </p>
        <p style="margin:0 0 4px 0; font-size:12px; color:#71717a;">${a.source}</p>
        <p style="margin:0; font-size:13px; color:#a1a1aa;">${sections.articleSummaries[i] || a.summary}</p>
      </td>
    </tr>`
    )
    .join("");

  const videoRows = content.videos
    .map(
      (v, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
        <p style="margin:0 0 4px 0; font-size:14px; font-weight:600; color:#e4e4e7;">
          <a href="${v.url}" style="color:#ef4444; text-decoration:none;">▶ ${v.title}</a>
        </p>
        <p style="margin:0 0 4px 0; font-size:12px; color:#71717a;">${v.channel}</p>
        <p style="margin:0; font-size:13px; color:#a1a1aa;">${sections.videoSummaries[i] || v.summary}</p>
      </td>
    </tr>`
    )
    .join("");

  const competitorRows = content.competitors
    .map(
      (c, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
        <p style="margin:0 0 4px 0;">
          <span style="font-size:11px; padding:2px 8px; background:#fbbf2420; color:#fbbf24; border-radius:4px; border:1px solid #fbbf2440;">${c.competitor}</span>
        </p>
        <p style="margin:4px 0; font-size:13px; color:#a1a1aa;">${sections.competitorCommentary[i] || c.insight}</p>
        <p style="margin:0; font-size:12px; color:#10b981; font-style:italic;">💡 ${c.opportunity}</p>
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sections.subject}</title>
</head>
<body style="margin:0; padding:0; background:#09090b; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111113; border:1px solid #27272a; border-radius:12px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#2563eb); padding:32px 40px;">
              <p style="margin:0 0 4px 0; font-size:12px; color:#c4b5fd; text-transform:uppercase; letter-spacing:1px;">Weekly Intelligence</p>
              <h1 style="margin:0 0 8px 0; font-size:24px; color:#ffffff; font-weight:700;">Voice AI Weekly</h1>
              <p style="margin:0; font-size:13px; color:#ddd6fe;">Week of ${weekOf} • Powered by Smallest AI</p>
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0; font-size:15px; color:#d4d4d8; line-height:1.7;">${sections.intro}</p>
            </td>
          </tr>
          <!-- Articles -->
          ${
            articleRows
              ? `<tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 16px 0; font-size:13px; color:#6366f1; text-transform:uppercase; letter-spacing:1px; font-weight:700;">📰 Top Stories</h2>
              <table width="100%" cellpadding="0" cellspacing="0">${articleRows}</table>
            </td>
          </tr>`
              : ""
          }
          <!-- Videos -->
          ${
            videoRows
              ? `<tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 16px 0; font-size:13px; color:#ef4444; text-transform:uppercase; letter-spacing:1px; font-weight:700;">🎥 Watch This Week</h2>
              <table width="100%" cellpadding="0" cellspacing="0">${videoRows}</table>
            </td>
          </tr>`
              : ""
          }
          <!-- Competitor Watch -->
          ${
            competitorRows
              ? `<tr>
            <td style="padding:0 40px 24px;">
              <h2 style="margin:0 0 16px 0; font-size:13px; color:#f59e0b; text-transform:uppercase; letter-spacing:1px; font-weight:700;">⚡ Competitor Watch</h2>
              <table width="100%" cellpadding="0" cellspacing="0">${competitorRows}</table>
            </td>
          </tr>`
              : ""
          }
          <!-- Market Signal -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background:#1c1c1e; border:1px solid #27272a; border-left:3px solid #10b981; border-radius:8px; padding:16px 20px;">
                <p style="margin:0 0 8px 0; font-size:11px; color:#10b981; text-transform:uppercase; letter-spacing:1px; font-weight:700;">📊 Market Signal</p>
                <p style="margin:0; font-size:13px; color:#a1a1aa; line-height:1.6;">${sections.marketSignalExpanded}</p>
              </div>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px; text-align:center;">
              <p style="margin:0 0 16px 0; font-size:13px; color:#71717a;">${sections.cta}</p>
              <a href="https://smallest.ai" style="display:inline-block; padding:12px 32px; background:linear-gradient(135deg,#7c3aed,#2563eb); color:#ffffff; text-decoration:none; border-radius:8px; font-size:14px; font-weight:600;">Book a Demo →</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0c0c0e; padding:20px 40px; border-top:1px solid #27272a;">
              <p style="margin:0; font-size:11px; color:#52525b; text-align:center;">Generated by NewsFlow • Smallest AI Internal Tool</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Plain text version ────────────────────────────────────────────────────

function buildPlainText(
  content: Awaited<ReturnType<typeof gatherContent>>,
  sections: GeneratedSections,
  weekOf: string
): string {
  const lines: string[] = [
    `VOICE AI WEEKLY — Week of ${weekOf}`,
    `Powered by Smallest AI`,
    "",
    sections.intro,
    "",
    "═══════════════════════════════════════",
    "📰 TOP STORIES",
    "═══════════════════════════════════════",
    ...content.articles.map(
      (a, i) =>
        `• ${a.title} (${a.source})\n  ${sections.articleSummaries[i] || a.summary}\n  ${a.url}`
    ),
    "",
    "═══════════════════════════════════════",
    "🎥 WATCH THIS WEEK",
    "═══════════════════════════════════════",
    ...content.videos.map(
      (v, i) =>
        `• ${v.title} — ${v.channel}\n  ${sections.videoSummaries[i] || v.summary}\n  ${v.url}`
    ),
    "",
    "═══════════════════════════════════════",
    "⚡ COMPETITOR WATCH",
    "═══════════════════════════════════════",
    ...content.competitors.map(
      (c, i) =>
        `• ${c.competitor}: ${sections.competitorCommentary[i] || c.insight}\n  💡 ${c.opportunity}`
    ),
    "",
    "═══════════════════════════════════════",
    "📊 MARKET SIGNAL",
    "═══════════════════════════════════════",
    sections.marketSignalExpanded,
    "",
    "═══════════════════════════════════════",
    sections.cta,
    "",
    "https://smallest.ai",
    "",
    "— Generated by NewsFlow, Smallest AI Internal Tool",
  ];

  return lines.join("\n");
}

// ── Main export ────────────────────────────────────────────────────────────

export async function generateNewsletter(): Promise<Newsletter> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekOf = format(weekStart, "MMMM d, yyyy");

  const content = await gatherContent();
  const sections = await generateNewsletterSections(content, weekOf);

  const htmlContent = buildHtml(content, sections, weekOf);
  const plainText = buildPlainText(content, sections, weekOf);

  const newsletter: Newsletter = {
    id: uuidv4(),
    generatedAt: now.toISOString(),
    weekOf,
    subject: sections.subject,
    previewText: sections.previewText,
    intro: sections.intro,
    articles: content.articles.map((a, i) => ({
      ...a,
      summary: sections.articleSummaries[i] || a.summary,
    })),
    videos: content.videos.map((v, i) => ({
      ...v,
      summary: sections.videoSummaries[i] || v.summary,
    })),
    competitorWatch: content.competitors.map((c, i) => ({
      ...c,
      insight: sections.competitorCommentary[i] || c.insight,
    })),
    marketSignal: sections.marketSignalExpanded,
    cta: sections.cta,
    htmlContent,
    plainText,
  };

  // Prepend to history, cap at MAX_HISTORY
  newsletterHistory.unshift(newsletter);
  if (newsletterHistory.length > MAX_HISTORY) {
    newsletterHistory.splice(MAX_HISTORY);
  }

  return newsletter;
}

export function getNewsletterHistory(): Newsletter[] {
  return newsletterHistory;
}
