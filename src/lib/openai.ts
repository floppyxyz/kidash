import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  return client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}
