import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateCategory } from "@/lib/categories";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/entries/[id]">
) {
  const { id } = await ctx.params;

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/entries/[id]">
) {
  const { id } = await ctx.params;

  let body: {
    title?: string;
    description?: string;
    url?: string;
    categorySlug?: string;
    categoryName?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  let categoryId = existing.categoryId;
  if (body.categorySlug) {
    const category = await getOrCreateCategory(
      body.categorySlug,
      body.categoryName ?? body.categorySlug
    );
    categoryId = category.id;
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      url: body.url,
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/entries/[id]">
) {
  const { id } = await ctx.params;

  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.entry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
