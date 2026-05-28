# NewsFlow — Voice AI Intelligence Dashboard

Team content curation and social media posting dashboard for Smallest AI.

## Features (MVP)

- **RSS Feed** — 14 sources across Voice AI, AI News, CX & Contact Center
- **Keyword Filtering** — Auto-tags articles by category (Voice AI, Use Cases, Market Intel, CX)
- **Caption Generation** — Claude AI writes LinkedIn, Twitter/X, and Instagram captions
- **Google Sheets Logging** — Every actioned article logs with date, status, team member, caption
- **Google OAuth** — Team login with your Google accounts

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in all values in .env.local

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### 1. Google OAuth (Team Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API** and **Google OAuth2 API**
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### 2. Google Service Account (Sheets API)
1. In same project, go to IAM & Admin → Service Accounts
2. Create a service account, download JSON key
3. Enable **Google Sheets API**
4. Create a Google Sheet named "NewsFlow Log" (or any name)
5. **Share the sheet** with your service account email (editor access)
6. Copy the Sheet ID from the URL and add to `.env.local`

### 3. Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### 4. Domain Restriction (Optional)
Set `ALLOWED_EMAIL_DOMAIN=smallest.ai` to restrict login to your company email domain.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main feed
│   ├── dashboard/page.tsx    # Team dashboard
│   ├── login/page.tsx        # Login page
│   └── api/
│       ├── feeds/            # RSS feed fetching
│       ├── generate-caption/ # Claude caption generation
│       ├── sheets/           # Google Sheets logging
│       └── auth/             # NextAuth Google OAuth
├── components/
│   ├── Sidebar.tsx           # Category navigation
│   ├── FilterBar.tsx         # Search + refresh
│   ├── ArticleCard.tsx       # Feed article card
│   ├── ArticleSidePanel.tsx  # Article detail + caption generator
│   ├── CaptionDisplay.tsx    # Platform captions with copy
│   └── Dashboard.tsx         # Team stats + activity
└── lib/
    ├── keywords.ts           # Keyword groups + RSS sources
    ├── rss.ts                # Feed fetching + parsing
    ├── claude.ts             # Caption generation
    └── sheets.ts             # Google Sheets integration
```

## RSS Sources

| Source | Category | Priority |
|--------|----------|----------|
| Voicebot.ai | Voice AI | High |
| Chatbots Life | Voice AI | High |
| Kore.ai Blog | Voice AI | High |
| Yellow.ai | Voice AI | High |
| TechCrunch AI | AI News | Medium |
| VentureBeat AI | AI News | Medium |
| The Verge | AI News | Medium |
| Ars Technica | AI News | Medium |
| MIT Tech Review | AI News | Medium |
| Ben's Bites | AI News | Medium |
| TLDR AI | AI News | Medium |
| CX Today | CX | Medium |
| Customer Think | CX | Medium |
| CallCentre Helper | CX | Medium |

## Tech Stack

- **Next.js 14** — App Router, Server Components
- **Tailwind CSS** — Dark UI
- **NextAuth.js** — Google OAuth
- **rss-parser** — RSS feed parsing
- **@anthropic-ai/sdk** — Claude caption generation
- **googleapis** — Google Sheets integration
