import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runHealthChecks } from "@/lib/health";

export async function POST() {
  await runHealthChecks();
  const entries = await prisma.entry.findMany({
    select: { id: true, status: true, statusCheckedAt: true },
  });
  return NextResponse.json({ checked: entries.length, statuses: entries });
}

export async function GET() {
  const entries = await prisma.entry.findMany({
    select: { id: true, status: true, statusCheckedAt: true },
  });
  return NextResponse.json({ statuses: entries });
}
