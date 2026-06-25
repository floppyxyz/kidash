"use client";

import { usePrivacyMode } from "@/components/privacy-mode";
import { BentoGrid } from "@/components/bento-grid";

type Entry = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  iconType: string | null;
  status: string | null;
  statusCheckedAt: Date | null;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  order: number;
  color: string | null;
  layoutX: number;
  layoutY: number;
  layoutW: number;
  layoutH: number;
  isPrivate: boolean;
};

type BentoGridWrapperProps = {
  categories: Category[];
  entries: Entry[];
};

export function BentoGridWrapper({ categories, entries }: BentoGridWrapperProps) {
  const { enabled } = usePrivacyMode();
  const baseKey = entries.map((e) => `${e.id}:${e.categoryId}`).join(",");

  return (
    <BentoGrid
      key={`${baseKey}:${enabled}`}
      categories={categories}
      entries={entries}
    />
  );
}
