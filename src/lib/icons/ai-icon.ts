import { getOpenAIClient, getModel } from "@/lib/openai";
import { getHostname } from "@/lib/url";
import { promises as fs } from "fs";
import path from "path";

const ICONS_DIR = path.join(process.cwd(), "public", "icons", "ai");

export type AiIconResult = {
  iconUrl: string;
  iconType: "ai";
} | null;

const SYSTEM_PROMPT = `You generate minimal app icons as SVG.
Rules:
- Return ONLY valid SVG markup, no markdown, no explanation
- The SVG must have a viewBox="0 0 64 64"
- Use a simple, flat design with 1-2 colors
- Make it recognizable and simple
- Background should be transparent
- Max 2KB SVG size`;

export async function resolveAiIcon(
  url: string,
  title: string | null,
  description: string | null
): Promise<AiIconResult> {
  const client = getOpenAIClient();
  if (!client) return null;

  const hostname = getHostname(url);
  const serviceName = title ?? hostname;

  const userPrompt = `Generate a simple icon for this service:
Name: ${serviceName}
URL: ${url}
${description ? `Description: ${description}` : ""}

Return only the SVG.`;

  try {
    const response = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const svg = extractSvg(content);
    if (!svg || !isValidSvg(svg)) return null;

    const iconUrl = await saveAiIcon(svg);
    return { iconUrl, iconType: "ai" };
  } catch (error) {
    console.error("[kidash] AI icon generation failed:", error);
    return null;
  }
}

function extractSvg(content: string): string | null {
  const match = content.match(/<svg[\s\S]*<\/svg>/i);
  return match ? match[0] : null;
}

function isValidSvg(svg: string): boolean {
  return svg.includes("<svg") && svg.includes("</svg>") && svg.length < 5000;
}

async function saveAiIcon(svg: string): Promise<string> {
  try {
    await fs.mkdir(ICONS_DIR, { recursive: true });
  } catch {
    // directory exists
  }

  const id = Math.random().toString(36).slice(2, 10);
  const filename = `${id}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  await fs.writeFile(filepath, svg, "utf-8");

  return `/icons/ai/${filename}`;
}
