"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EntryCard } from "@/components/entry-card";
import { CategoryName } from "@/components/category-name";

type Entry = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  iconType: string | null;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  order: number;
  color: string | null;
};

type DashboardDndProps = {
  categories: Category[];
  entries: Entry[];
};

type ItemsMap = Record<string, Entry[]>;

const CATEGORY_PREFIX = "cat:";
const SLOT_PREFIX = "slot:";

function categoryId(id: string) {
  return `${CATEGORY_PREFIX}${id}`;
}

function slotId(categoryId: string, index: number) {
  return `${SLOT_PREFIX}${categoryId}:${index}`;
}

function parseSlotId(id: string): { categoryId: string; index: number } | null {
  if (!id.startsWith(SLOT_PREFIX)) return null;
  const rest = id.slice(SLOT_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  return {
    categoryId: rest.slice(0, lastColon),
    index: parseInt(rest.slice(lastColon + 1), 10),
  };
}

export function DashboardDnd({ categories: initialCategories, entries }: DashboardDndProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState<ItemsMap>(() => {
    const map: ItemsMap = {};
    for (const cat of initialCategories) {
      map[cat.id] = entries.filter((e) => e.categoryId === cat.id);
    }
    return map;
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const isDraggingItem = activeId !== null && !activeId.startsWith(CATEGORY_PREFIX);

  const activeEntry = activeId
    ? Object.values(items).flat().find((e) => e.id === activeId)
    : null;

  const activeCategory = activeId?.startsWith(CATEGORY_PREFIX)
    ? categories.find((c) => c.id === activeId.slice(CATEGORY_PREFIX.length))
    : null;

  function findContainerOf(id: string): string | null {
    for (const [catId, entryList] of Object.entries(items)) {
      if (entryList.some((e) => e.id === id)) return catId;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith(CATEGORY_PREFIX)) return;

    const slot = parseSlotId(overId);

    if (slot) {
      const activeContainer = findContainerOf(activeId);
      if (!activeContainer) return;

      setItems((prev) => {
        const activeItems = [...prev[activeContainer]];
        const activeIndex = activeItems.findIndex((e) => e.id === activeId);
        if (activeIndex === -1) return prev;

        const [moved] = activeItems.splice(activeIndex, 1);

        if (slot.categoryId === activeContainer) {
          let insertIndex = slot.index;
          if (activeIndex < slot.index) insertIndex--;
          insertIndex = Math.max(0, Math.min(insertIndex, activeItems.length));
          activeItems.splice(insertIndex, 0, moved);
          return { ...prev, [activeContainer]: activeItems };
        } else {
          const overItems = [...prev[slot.categoryId] ?? []];
          const insertIndex = Math.min(slot.index, overItems.length);
          overItems.splice(insertIndex, 0, moved);
          return {
            ...prev,
            [activeContainer]: activeItems,
            [slot.categoryId]: overItems,
          };
        }
      });
      return;
    }

    const activeContainer = findContainerOf(activeId);
    let overContainer = findContainerOf(overId);

    if (!overContainer) {
      if (overId.startsWith("drop:")) {
        overContainer = overId.slice(5);
      } else if (categories.some((c) => c.id === overId || categoryId(c.id) === overId)) {
        overContainer = overId.startsWith(CATEGORY_PREFIX)
          ? overId.slice(CATEGORY_PREFIX.length)
          : overId;
      }
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((e) => e.id === activeId);

      const newActiveItems = [...activeItems];
      const [moved] = newActiveItems.splice(activeIndex, 1);
      const newOverItems = [...overItems, moved];

      return {
        ...prev,
        [activeContainer]: newActiveItems,
        [overContainer]: newOverItems,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith(CATEGORY_PREFIX)) {
      const activeCatId = activeId.slice(CATEGORY_PREFIX.length);
      const overCatId = overId.startsWith(CATEGORY_PREFIX)
        ? overId.slice(CATEGORY_PREFIX.length)
        : overId;

      const oldIndex = categories.findIndex((c) => c.id === activeCatId);
      const newIndex = categories.findIndex((c) => c.id === overCatId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCats = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCats);
        saveCategoryOrder(newCats);
      }
      return;
    }

    saveOrder(items);
  }

  async function saveOrder(itemsToSave: ItemsMap) {
    const allItems: { id: string; categoryId: string; order: number }[] = [];
    for (const [catId, entryList] of Object.entries(itemsToSave)) {
      entryList.forEach((entry, index) => {
        allItems.push({ id: entry.id, categoryId: catId, order: index });
      });
    }

    try {
      await fetch("/api/entries/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: allItems }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to save order:", error);
    }
  }

  async function saveCategoryOrder(cats: Category[]) {
    try {
      await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: cats.map((c, i) => ({ id: c.id, order: i })),
        }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to save category order:", error);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((c) => categoryId(c.id))}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-8">
          {categories.map((category) => (
            <SortableCategorySection
              key={category.id}
              category={category}
              entries={items[category.id] ?? []}
              isDraggingItem={isDraggingItem}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeEntry ? (
          <div className="mb-3 mr-3 w-full cursor-grabbing rotate-2 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
            <EntryCard entry={activeEntry} />
          </div>
        ) : activeCategory ? (
          <div className="cursor-grabbing rotate-1 opacity-90">
            <span className="rounded bg-zinc-800 px-2 py-1 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              {activeCategory.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DropSlot({
  id,
  visible,
}: {
  id: string;
  visible: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  if (!visible && !isOver) {
    return <div ref={setNodeRef} className="w-0" />;
  }

  return (
    <div
      ref={setNodeRef}
      className={`mr-3 mb-3 flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition-all duration-150 ${
        isOver
          ? "w-full border-zinc-400 bg-zinc-700/60 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]"
          : "w-8 border-zinc-600 bg-zinc-800/40"
      }`}
      style={{ minHeight: "5rem" }}
    >
      {isOver && (
        <span className="text-xs font-medium text-zinc-300">
          Drop here
        </span>
      )}
    </div>
  );
}

function SortableCategorySection({
  category,
  entries,
  isDraggingItem,
}: {
  category: Category;
  entries: Entry[];
  isDraggingItem: boolean;
}) {
  const {
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoryId(category.id) });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop:${category.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <section ref={setSortableRef} style={style}>
      <div className="flex items-center gap-2">
        <span className="cursor-grab text-zinc-600 hover:text-zinc-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </span>
        <CategoryName category={category} />
      </div>

      <div
        ref={setDroppableRef}
        className={`mt-3 min-h-[80px] rounded-lg border-2 border-dashed p-3 transition ${
          isOver
            ? "border-zinc-400 bg-zinc-800/60"
            : "border-transparent"
        }`}
      >
        <SortableContext
          id={category.id}
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-sm text-zinc-600">
              {isOver ? "Drop here" : "Empty — drag entries here"}
            </div>
          ) : (
            <div className="flex flex-wrap">
              {entries.map((entry, i) => (
                <Fragment key={entry.id}>
                  <DropSlot
                    id={slotId(category.id, i)}
                    visible={isDraggingItem}
                  />
                  <div className="mb-3 mr-3 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]">
                    <EntryCard entry={entry} />
                  </div>
                </Fragment>
              ))}
              <DropSlot
                id={slotId(category.id, entries.length)}
                visible={isDraggingItem}
              />
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  );
}
