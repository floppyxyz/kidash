import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [categories, entries] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.entry.findMany({ orderBy: { order: "asc" } }),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    entries,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kidash-backup-${date}.json"`,
    },
  });
}
