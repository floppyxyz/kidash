import { prisma } from "@/lib/db";

const TIMEOUT_MS = 5000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function checkUrl(url: string): Promise<"up" | "down"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    return res.ok || res.status < 500 ? "up" : "down";
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
      return res.ok || res.status < 500 ? "up" : "down";
    } catch {
      return "down";
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function runHealthChecks() {
  const entries = await prisma.entry.findMany({
    select: { id: true, url: true },
  });

  for (const entry of entries) {
    const status = await checkUrl(entry.url);
    await prisma.entry.update({
      where: { id: entry.id },
      data: {
        status,
        statusCheckedAt: new Date(),
      },
    });
  }
}

let pingerStarted = false;

export function startHealthPinger() {
  if (pingerStarted) return;
  pingerStarted = true;

  setTimeout(() => {
    runHealthChecks().catch((e) => {
      console.error("[kidash] Health check failed:", e);
    });
  }, 10_000);

  setInterval(() => {
    runHealthChecks().catch((e) => {
      console.error("[kidash] Health check failed:", e);
    });
  }, CHECK_INTERVAL_MS);

  console.log(`[kidash] Health pinger started (interval: ${CHECK_INTERVAL_MS / 1000}s)`);
}
