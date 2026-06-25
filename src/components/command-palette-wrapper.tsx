"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/command-palette";

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
};

export function CommandPaletteWrapper() {
  const [data, setData] = useState<{
    entries: Entry[];
    categories: Category[];
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/entries").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([entriesData, categoriesData]) => {
        setData({
          entries: entriesData.entries ?? [],
          categories: categoriesData.categories ?? [],
        });
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return <CommandPalette entries={data.entries} categories={data.categories} />;
}
