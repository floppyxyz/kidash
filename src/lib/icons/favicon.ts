import { isUrlReachable } from "./check-url";
import type { FetchedMetadata } from "@/lib/fetch-metadata";

export type IconResult = {
  iconUrl: string;
  iconType: "favicon";
} | null;

export async function resolveFavicon(
  url: string,
  metadata: FetchedMetadata | null
): Promise<IconResult> {
  const candidates: string[] = [];

  if (metadata?.faviconUrls.length) {
    candidates.push(...metadata.faviconUrls);
  }

  const urlObj = new URL(url);
  const defaultFavicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
  if (!candidates.includes(defaultFavicon)) {
    candidates.push(defaultFavicon);
  }

  for (const candidate of candidates) {
    if (candidate === "data:,") continue;
    if (await isUrlReachable(candidate)) {
      return { iconUrl: candidate, iconType: "favicon" };
    }
  }

  if (process.env.ALLOW_GOOGLE_FAVICONS === "true") {
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    if (await isUrlReachable(googleFavicon)) {
      return { iconUrl: googleFavicon, iconType: "favicon" };
    }
  }

  return null;
}
