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
