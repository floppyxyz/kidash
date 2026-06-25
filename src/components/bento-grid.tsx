"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveReactGridLayout as RGL, WidthProvider } from "react-grid-layout/legacy";
import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout";
import { EntryCard } from "@/components/entry-card";
import { CategoryName } from "@/components/category-name";
import { useViewMode } from "@/components/view-mode";
import { usePrivacyMode } from "@/components/privacy-mode";

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

type BentoGridProps = {
  categories: Category[];
  entries: Entry[];
};

const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const GridLayout = WidthProvider(RGL);

export function BentoGrid({ categories, entries }: BentoGridProps) {
  const router = useRouter();
  const { mode } = useViewMode();
  const compact = mode === "compact";
  const { enabled: privacyEnabled } = usePrivacyMode();
  const [saving, setSaving] = useState(false);

  const visibleCategories = privacyEnabled
    ? categories.filter((c) => !c.isPrivate)
    : categories;

  const visibleEntries = privacyEnabled
    ? entries.filter((e) => visibleCategories.some((c) => c.id === e.categoryId))
    : entries;

  type ItemsMap = Record<string, Entry[]>;

  const [items, setItems] = useState<ItemsMap>(() => {
    const map: ItemsMap = {};
    for (const cat of visibleCategories) {
      map[cat.id] = visibleEntries.filter((e) => e.categoryId === cat.id);
    }
    return map;
  });

  function findContainerOf(id: string): string | null {
    for (const [catId, entryList] of Object.entries(items)) {
      if (entryList.some((e) => e.id === id)) return catId;
    }
    return null;
  }

  function saveEntryOrder(itemsToSave: ItemsMap) {
    const allItems: { id: string; categoryId: string; order: number }[] = [];
    for (const [catId, entryList] of Object.entries(itemsToSave)) {
      entryList.forEach((entry, index) => {
        allItems.push({ id: entry.id, categoryId: catId, order: index });
      });
    }
    fetch("/api/entries/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: allItems }),
    })
      .then(() => router.refresh())
      .catch((e) => console.error("Failed to save order:", e));
  }

  const initialLayouts: ResponsiveLayouts = {
    lg: visibleCategories.map<LayoutItem>((c) => ({
      i: c.id,
      x: c.layoutX,
      y: c.layoutY,
      w: c.layoutW,
      h: c.layoutH,
      minW: 3,
      minH: 2,
    })),
  };

  const latestLayoutRef = useRef<Layout>([]);

  const saveLayout = useCallback(
    (newLayout: Layout) => {
      setSaving(true);
      fetch("/api/categories/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: newLayout.map((item: LayoutItem) => ({
            id: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          })),
        }),
      })
        .catch((e) => console.error("Failed to save layout:", e))
        .finally(() => setSaving(false));
    },
    []
  );

  const handleLayoutChange = useCallback((currentLayout: Layout) => {
    latestLayoutRef.current = currentLayout;
  }, []);

  const handleDragStop = useCallback((currentLayout: Layout) => {
    latestLayoutRef.current = currentLayout;
    saveLayout(currentLayout);
  }, [saveLayout]);

  const handleResizeStop = useCallback((currentLayout: Layout) => {
    latestLayoutRef.current = currentLayout;
    saveLayout(currentLayout);
  }, [saveLayout]);

  function moveEntry(entryId: string, direction: "up" | "down") {
    const catId = findContainerOf(entryId);
    if (!catId) return;

    const list = items[catId];
    const index = list.findIndex((e) => e.id === entryId);
    if (index === -1) return;

    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const newList = [...list];
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];

    const newItems = { ...items, [catId]: newList };
    setItems(newItems);
    saveEntryOrder(newItems);
  }

  return (
    <div className="relative w-full">
      {saving && (
        <div
          className="fixed right-4 top-20 z-50 rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "var(--card-hover)", color: "var(--muted)" }}
        >
          Saving...
        </div>
      )}
      <GridLayout
        className="layout"
        layouts={initialLayouts}
        cols={COLS}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        rowHeight={60}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        compactType={null}
        preventCollision
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        draggableHandle=".category-drag-handle"
        measureBeforeMount
      >
        {visibleCategories.map((category) => {
          const catEntries = items[category.id] ?? [];
          return (
            <div
              key={category.id}
              id={`category-${category.id}`}
              className="flex flex-col overflow-hidden border"
              style={{
                borderRadius: "var(--radius-lg)",
                borderColor: "var(--border)",
                background: "var(--card)",
              }}
            >
              <div
                className="category-drag-handle flex shrink-0 cursor-grab items-center gap-2 border-b px-4 py-3 active:cursor-grabbing"
                style={{ borderColor: "var(--border)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--muted)" }}>
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
                <CategoryName category={category} />
              </div>
              <div className="flex-1 overflow-auto p-3">
                {catEntries.length === 0 ? (
                  <p className="py-4 text-center text-sm" style={{ color: "var(--muted)" }}>
                    Empty — add entries via the input above
                  </p>
                ) : (
                  <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${compact ? "lg:grid-cols-3 xl:grid-cols-4" : ""}`}>
                    {catEntries.map((entry, i) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onMoveUp={i > 0 ? () => moveEntry(entry.id, "up") : undefined}
                        onMoveDown={i < catEntries.length - 1 ? () => moveEntry(entry.id, "down") : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
