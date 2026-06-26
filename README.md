# kidash

A minimal AI-powered dashboard for selfhosters. Throw in a URL or IP from your network — kidash fetches metadata, resolves an icon, categorizes it, and renders a clean bento-grid dashboard.

## Features

- **AI enrichment** — title, description, category, and color auto-detected via OpenAI
- **3-stage icon resolution** — favicon → Simple Icons library → AI-generated SVG
- **Bento grid layout** — drag, resize, and arrange categories freely
- **7 built-in themes** — Midnight, Nord, Dracula, Solarized Dark, Gruvbox, Light, Terminal
- **Custom themes** — JSON files in `themes/`, mountable in Docker
- **Privacy mode** — mark categories as private, toggle via toolbar or Cmd+K, optional timer
- **Health checks** — optional background pinger with status dots on cards
- **View modes** — detailed (full info) or compact (icon + title)
- **Command palette** — Cmd+K / Ctrl+K to search entries, categories, and actions
- **Backup & restore** — export/import all data as JSON
- **PWA** — installable on home screen
- **Single Docker container** — SQLite in `/data` volume, no external deps

## Quick Start

```bash
# 1. Create .env from example
cp .env.example .env

# 2. Fill in your values
#    OPENAI_API_KEY  - required (get one at https://platform.openai.com)
#    AUTH_TOKEN      - required (e.g. `openssl rand -hex 32`)

# 3. Start
docker compose up -d
```

Open `http://localhost:3100` and log in with your `AUTH_TOKEN`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | yes | — | OpenAI API key for AI enrichment and icon generation |
| `AUTH_TOKEN` | yes | — | Bearer token for login and write operations |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | OpenAI model to use |
| `DATABASE_URL` | no | `file:/data/kidash.db` | SQLite database URL (`file:` prefix) |
| `ALLOW_GOOGLE_FAVICONS` | no | `false` | Enable Google favicon fallback (sends hostnames to Google) |
| `ENABLE_HEALTH_PINGER` | no | `false` | Enable background health checks (server pings your URLs every 5 min) |

## Themes

Themes are JSON files in the `themes/` directory. Create one:

```json
{
  "name": "My Theme",
  "colors": {
    "--background": "#1a1b26",
    "--foreground": "#c0caf5",
    "--card": "#24283b",
    "--card-hover": "#2e334d",
    "--border": "#2e334d",
    "--border-hover": "#414868",
    "--muted": "#565f89",
    "--accent": "#7aa2f7"
  },
  "fonts": {
    "--font-sans": "Inter, system-ui, sans-serif",
    "--font-size-base": "14px"
  },
  "radius": {
    "--radius-sm": "4px",
    "--radius-md": "8px",
    "--radius-lg": "12px"
  },
  "customCss": "/* optional custom CSS */"
}
```

Restart kidash — the theme appears in the selector. In Docker, `themes/` is mounted read-only from your host.

## Privacy

- **No URL or hostname sent to AI** — only page title and description are used for categorization and icon generation
- **Google favicon fallback** and **health pinger** are disabled by default — enable explicitly via env vars
- **Privacy mode** hides private categories from the dashboard — useful for screen sharing

## Development

```bash
npm install
npm run dev
```

Set `AUTH_TOKEN` and `OPENAI_API_KEY` in `.env` (or `.env.local`).

## Docker Image

Pre-built images are available on GitHub Container Registry:

```bash
docker pull ghcr.io/<owner>/kidash:latest
```

### Releasing

```bash
./scripts/bump-version.sh patch   # v0.0.1
./scripts/bump-version.sh minor   # v0.1.0
./scripts/bump-version.sh major   # v1.0.0
```

Pushing a `v*` tag triggers the GitHub Actions workflow to build and publish the image.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- SQLite via Prisma 7 (driver adapter)
- OpenAI API
- react-grid-layout
