import { prisma } from "@/lib/db";

export async function getOrCreateCategory(slug: string, name?: string) {
  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) return existing;

  const maxOrder = await prisma.category.aggregate({
    _max: { order: true },
  });

  return prisma.category.create({
    data: {
      slug,
      name: name ?? slug,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
}
