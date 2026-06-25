import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeUrl, getHostname } from "@/lib/url";
import { fetchMetadata } from "@/lib/fetch-metadata";
import { getOrCreateCategory } from "@/lib/categories";
import { resolveIcon } from "@/lib/icons/resolve-icon";
import { enrichEntry } from "@/lib/ai/enrich";

export async function GET() {
  const entries = await prisma.entry.findMany({
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.url?.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(body.url);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid URL" },
      { status: 400 }
    );
  }

  const metadata = await fetchMetadata(normalizedUrl);
  const enriched = await enrichEntry(
    normalizedUrl,
    metadata?.title ?? null,
    metadata?.description ?? null
  );

  const title = enriched?.title ?? metadata?.title ?? getHostname(normalizedUrl);
  const description = enriched?.description ?? metadata?.description ?? null;

  const icon = await resolveIcon(
    normalizedUrl,
    metadata,
    title,
    description
  );

  const categorySlug = enriched?.categorySlug ?? "uncategorized";
  const categoryName = enriched?.categoryName ?? "Uncategorized";
  const category = await getOrCreateCategory(categorySlug, categoryName);

  if (enriched?.color) {
    await prisma.category.updateMany({
      where: { id: category.id, color: null },
      data: { color: enriched.color },
    });
  }

  const maxOrder = await prisma.entry.aggregate({
    _max: { order: true },
    where: { categoryId: category.id },
  });

  const entry = await prisma.entry.create({
    data: {
      url: normalizedUrl,
      title,
      description,
      categoryId: category.id,
      iconUrl: icon?.iconUrl ?? null,
      iconType: icon?.iconType ?? null,
      color: enriched?.color ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: { category: true },
  });

  const needsEditing = !metadata?.title && !metadata?.description;

  return NextResponse.json({ entry, needsEditing }, { status: 201 });
}
