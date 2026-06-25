import * as cheerio from "cheerio";

export type FetchedMetadata = {
  title: string | null;
  description: string | null;
  faviconUrls: string[];
};

export async function fetchMetadata(
  url: string
): Promise<FetchedMetadata | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "kidash/0.1 (+https://github.com/kidash)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $("title").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      null;

    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      null;

    const faviconUrls = extractFaviconUrls($, url);

    return { title, description, faviconUrls };
  } catch {
    return null;
  }
}

function extractFaviconUrls(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const absolute = new URL(href, baseUrl).toString();
        if (!seen.has(absolute)) {
          seen.add(absolute);
          urls.push(absolute);
        }
      } catch {
        // skip invalid hrefs
      }
    });

  const baseUrlObj = new URL(baseUrl);
  const defaultFavicon = `${baseUrlObj.protocol}//${baseUrlObj.host}/favicon.ico`;
  if (!seen.has(defaultFavicon)) {
    urls.push(defaultFavicon);
  }

  return urls;
}
