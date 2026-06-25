# kidash

A minimal AI-powered dashboard for selfhosters. Throw in a URL or IP from your network — kidash generates a clean dashboard entry with icon, title, description, and category automatically.

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

Open `http://localhost:3000`.

## Development

```bash
npm install
npm run dev
```

## Environment Variables

| Variable           | Required | Default              | Description                          |
| ------------------ | -------- | -------------------- | ------------------------------------ |
| `OPENAI_API_KEY`   | yes      | -                    | OpenAI API key for AI enrichment     |
| `AUTH_TOKEN`       | yes      | -                    | Bearer token for write operations    |
| `OPENAI_MODEL`     | no       | `gpt-4o-mini`        | OpenAI model to use                  |
| `DATABASE_URL`     | no       | `file:/data/kidash.db`| SQLite database URL (`file:` prefix) |

## Themes

kidash supports custom themes. Themes are JSON files in the `themes/` directory.

### Built-in Themes

- Midnight (default dark)
- Nord
- Dracula
- Solarized Dark
- Gruvbox
- Light

### Adding Custom Themes

1. Create a JSON file in the `themes/` directory:

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
  }
}
```

2. Restart kidash — the theme appears automatically in the theme selector (bottom-left corner).

### Docker

The `themes/` directory is mounted read-only from your host. To add themes:

```bash
# Place your theme files in ./themes/
echo '{ "name": "Custom", "colors": { ... } }' > ./themes/custom.json

# Restart
docker compose restart
```

Or mount a custom directory:

```yaml
volumes:
  - /path/to/my/themes:/app/themes:ro
```
