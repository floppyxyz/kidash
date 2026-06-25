import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type BackupData = {
  version?: number;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    order: number;
    color: string | null;
    layoutX: number;
    layoutY: number;
    layoutW: number;
    layoutH: number;
  }>;
  entries?: Array<{
    id: string;
    url: string;
    title: string;
    description: string | null;
    categoryId: string;
    iconUrl: string | null;
    iconType: string | null;
    color: string | null;
    order: number;
  }>;
};

export async function POST(request: Request) {
  let body: BackupData;
  try {
    body = (await request.json()) as BackupData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.categories || !body.entries) {
    return NextResponse.json(
      { error: "Backup must contain categories and entries arrays" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.entry.deleteMany(),
    prisma.category.deleteMany(),
    ...body.categories.map((c) =>
      prisma.category.create({
        data: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          order: c.order,
          color: c.color,
          layoutX: c.layoutX,
          layoutY: c.layoutY,
          layoutW: c.layoutW,
          layoutH: c.layoutH,
        },
      })
    ),
    ...body.entries.map((e) =>
      prisma.entry.create({
        data: {
          id: e.id,
          url: e.url,
          title: e.title,
          description: e.description,
          categoryId: e.categoryId,
          iconUrl: e.iconUrl,
          iconType: e.iconType,
          color: e.color,
          order: e.order,
        },
      })
    ),
  ]);

  return NextResponse.json({
    imported: {
      categories: body.categories.length,
      entries: body.entries.length,
    },
  });
}
