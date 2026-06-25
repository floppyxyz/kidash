import type { FetchedMetadata } from "@/lib/fetch-metadata";
import { resolveFavicon } from "./favicon";
import { resolveLibraryIcon } from "./library";
import { resolveAiIcon } from "./ai-icon";

export type ResolvedIcon = {
  iconUrl: string;
  iconType: "favicon" | "library" | "ai";
} | null;

export async function resolveIcon(
  url: string,
  metadata: FetchedMetadata | null,
  enrichedTitle: string | null = null,
  enrichedDescription: string | null = null
): Promise<ResolvedIcon> {
  const faviconResult = await resolveFavicon(url, metadata);
  if (faviconResult) return faviconResult;

  const libraryResult = await resolveLibraryIcon(url, metadata?.title ?? enrichedTitle);
  if (libraryResult) return libraryResult;

  const aiResult = await resolveAiIcon(
    enrichedTitle ?? metadata?.title ?? null,
    enrichedDescription ?? metadata?.description ?? null
  );
  if (aiResult) return aiResult;

  return null;
}
