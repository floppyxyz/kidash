import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: { id: string; name?: string; isPrivate?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const data: { name?: string; isPrivate?: boolean } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.isPrivate === "boolean") {
    data.isPrivate = body.isPrivate;
  }

  const category = await prisma.category.update({
    where: { id: body.id },
    data,
  });

  return NextResponse.json({ category });
}
