import { getOpenAIClient, getModel } from "@/lib/openai";
import { getHostname } from "@/lib/url";

export type EnrichedData = {
  title: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  color: string | null;
};

const SYSTEM_PROMPT = `You are a dashboard categorizer for selfhosted services.
Analyze the given URL, title, and description of a web service.
Return ONLY valid JSON with this exact structure:
{
  "title": "Short, clean service name (max 40 chars)",
  "description": "One sentence description (max 100 chars)",
  "categorySlug": "lowercase-single-word-slug",
  "categoryName": "Human readable category name",
  "color": "hex color without #, e.g. 0082C9"
}

Common categories: media, network, automation, storage, monitoring, development, home, security, productivity, download, other

If the URL is just an IP or hostname without recognizable service, derive the category from the port or hostname.
Return the raw JSON only, no markdown, no explanation.`;

export async function enrichEntry(
  url: string,
  fetchedTitle: string | null,
  fetchedDescription: string | null
): Promise<EnrichedData | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const hostname = getHostname(url);

  const userPrompt = `URL: ${url}
Hostname: ${hostname}
${fetchedTitle ? `Page title: ${fetchedTitle}` : "Page title: (not available)"}
${fetchedDescription ? `Description: ${fetchedDescription}` : "Description: (not available)"}`;

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      title: parsed.title ?? fetchedTitle ?? hostname,
      description: parsed.description ?? fetchedDescription,
      categorySlug: sanitizeSlug(parsed.categorySlug ?? "other"),
      categoryName: parsed.categoryName ?? parsed.categorySlug ?? "Other",
      color: parsed.color ?? null,
    };
  } catch (error) {
    console.error("[kidash] AI enrichment failed:", error);
    return null;
  }
}

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "other";
}
