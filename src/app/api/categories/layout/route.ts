import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type LayoutItem = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export async function POST(request: Request) {
  let body: { layout: LayoutItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.layout)) {
    return NextResponse.json({ error: "layout must be an array" }, { status: 400 });
  }

  await prisma.$transaction(
    body.layout.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: {
          layoutX: item.x,
          layoutY: item.y,
          layoutW: item.w,
          layoutH: item.h,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
