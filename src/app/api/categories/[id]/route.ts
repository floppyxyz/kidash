import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/categories/[id]">
) {
  const { id } = await ctx.params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const entryCount = await prisma.entry.count({ where: { categoryId: id } });
  if (entryCount > 0) {
    return NextResponse.json(
      { error: `Category has ${entryCount} entries. Move or delete them first.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
