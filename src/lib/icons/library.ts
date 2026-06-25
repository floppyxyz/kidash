import { siSlug } from "@/lib/icons/si-slug";
import { saveLibraryIcon } from "@/lib/icons/save-icon";

export type LibraryIconResult = {
  iconUrl: string;
  iconType: "library";
} | null;

export async function resolveLibraryIcon(
  url: string,
  title: string | null
): Promise<LibraryIconResult> {
  const hostname = new URL(url).hostname;
  const candidates = generateSlugCandidates(hostname, title);

  for (const slug of candidates) {
    const icon = siSlug(slug);
    if (icon) {
      const iconUrl = await saveLibraryIcon(icon.slug, icon.svg);
      return { iconUrl, iconType: "library" };
    }
  }

  return null;
}

function generateSlugCandidates(hostname: string, title: string | null): string[] {
  const candidates: string[] = [];

  const parts = hostname.split(".");
  for (const part of parts) {
    if (part.length > 2 && !["com", "org", "net", "io", "dev", "app"].includes(part)) {
      candidates.push(part);
    }
  }

  if (hostname.startsWith("www.")) {
    candidates.push(hostname.slice(4).split(".")[0]);
  }

  if (title) {
    const titleClean = title
      .replace(/\s*\|.*$/, "")
      .replace(/\s*[-–—].*$/, "")
      .trim();
    candidates.push(titleClean.toLowerCase().replace(/\s+/g, ""));
    candidates.push(titleClean.toLowerCase().split(/\s+/)[0]);
  }

  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}
