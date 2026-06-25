import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: { id: string; name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.name?.trim()) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id: body.id },
    data: { name: body.name.trim() },
  });

  return NextResponse.json({ category });
}
