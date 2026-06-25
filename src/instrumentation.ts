export async function register() {
  if (!process.env.AUTH_TOKEN) {
    console.error(
      "\x1b[31m[kidash] FATAL: AUTH_TOKEN environment variable is not set.\x1b[0m\n" +
        "[kidash] Set it in your .env file or Docker environment.\n" +
        "[kidash] Example: AUTH_TOKEN=$(openssl rand -hex 32)\n" +
        "[kidash] The dashboard will load, but write operations (POST/PATCH/DELETE) will fail."
    );
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "\x1b[33m[kidash] WARNING: OPENAI_API_KEY is not set. AI enrichment will be disabled.\x1b[0m"
    );
  }

  if (process.env.ENABLE_HEALTH_PINGER === "true") {
    const { startHealthPinger } = await import("@/lib/health");
    startHealthPinger();
  }
}
