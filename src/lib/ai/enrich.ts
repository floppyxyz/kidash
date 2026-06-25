import { getOpenAIClient, getModel } from "@/lib/openai";
import { prisma } from "@/lib/db";

export type EnrichedData = {
  title: string;
  description: string | null;
  categorySlug: string;
  categoryName: string;
  categoryIsNew: boolean;
  color: string | null;
};

const SYSTEM_PROMPT = `You are a dashboard categorizer for selfhosted services.
Analyze the given URL, title, and description of a web service.

You will receive a list of EXISTING categories. Your job:
1. If an existing category fits reasonably well, reuse it (return its slug + name).
2. Only create a NEW category if none of the existing ones fit at all.
3. Be generous: "media" fits for streaming, video, music, photos. "network" fits for routers, DNS, firewalls. "automation" fits for home automation, smart home.
4. Do not create hyper-specific categories like "plex" or "nextcloud" — use the broader existing one.

Return ONLY valid JSON with this exact structure:
{
  "title": "Short, clean service name (max 40 chars)",
  "description": "One sentence description (max 100 chars)",
  "categorySlug": "the slug you chose",
  "categoryName": "human readable name",
  "categoryIsNew": true or false,
  "color": "hex color without #, e.g. 0082C9"
}

Return the raw JSON only, no markdown, no explanation.`;

export async function enrichEntry(
  url: string,
  fetchedTitle: string | null,
  fetchedDescription: string | null
): Promise<EnrichedData | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const existingCategories = await prisma.category.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const categoriesList = existingCategories.length > 0
    ? existingCategories.map((c) => `- ${c.slug} (${c.name})`).join("\n")
    : "(none yet)";

  const userPrompt = `${fetchedTitle ? `Page title: ${fetchedTitle}` : "Page title: (not available)"}
${fetchedDescription ? `Description: ${fetchedDescription}` : "Description: (not available)"}

EXISTING CATEGORIES:
${categoriesList}

Choose an existing category if one fits reasonably well. Only create a new one if nothing fits.`;

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
      title: parsed.title ?? fetchedTitle ?? "Unknown Service",
      description: parsed.description ?? fetchedDescription,
      categorySlug: sanitizeSlug(parsed.categorySlug ?? "other"),
      categoryName: parsed.categoryName ?? parsed.categorySlug ?? "Other",
      categoryIsNew: parsed.categoryIsNew === true,
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
