import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ReorderItem = {
  id: string;
  categoryId: string;
  order: number;
};

export async function POST(request: Request) {
  let body: { items: ReorderItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    body.items.map((item) =>
      prisma.entry.update({
        where: { id: item.id },
        data: {
          categoryId: item.categoryId,
          order: item.order,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
