import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type CategoryOrder = {
  id: string;
  order: number;
};

export async function POST(request: Request) {
  let body: { categories: CategoryOrder[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.categories)) {
    return NextResponse.json({ error: "categories must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    body.categories.map((cat) =>
      prisma.category.update({
        where: { id: cat.id },
        data: { order: cat.order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
