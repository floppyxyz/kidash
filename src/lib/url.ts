export function normalizeUrl(input: string): string {
  let url = input.trim();

  if (!url) throw new Error("URL is required");

  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }

  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  return url;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
