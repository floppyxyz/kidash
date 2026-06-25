const TIMEOUT_MS = 4000;

export async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "kidash/0.1" },
    });

    clearTimeout(timeout);

    if (res.ok) return true;

    if (res.status === 405 || res.status === 403) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

      const getRes = await fetch(url, {
        method: "GET",
        signal: controller2.signal,
        redirect: "follow",
        headers: { "User-Agent": "kidash/0.1" },
      });

      clearTimeout(timeout2);

      return getRes.ok;
    }

    return false;
  } catch {
    return false;
  }
}
