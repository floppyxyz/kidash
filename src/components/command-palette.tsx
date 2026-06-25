"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
};

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  icon?: string;
  action: () => void;
  group: string;
};

type CommandPaletteProps = {
  entries: Entry[];
  categories: Category[];
};

export function CommandPalette({ entries, categories }: CommandPaletteProps) {
  const router = useRouter();
  const { enabled: privacyEnabled, toggle: togglePrivacy } = usePrivacyMode();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return !prev;
        });
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedIndex(0);
  }

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    items.push({
      id: "add-entry",
      label: "Add new entry",
      hint: "Focus input",
      group: "Actions",
      action: () => {
        document.getElementById("add-entry-input")?.focus();
      },
    });

    items.push({
      id: "add-category",
      label: "Add new category",
      hint: "Create category",
      group: "Actions",
      action: () => {
        document.getElementById("add-category-btn")?.click();
      },
    });

    items.push({
      id: "settings",
      label: "Open Settings",
      hint: "Backup & restore",
      group: "Actions",
      action: () => {
        router.push("/settings");
      },
    });

    items.push({
      id: "toggle-privacy",
      label: privacyEnabled ? "Disable Privacy Mode" : "Enable Privacy Mode",
      hint: privacyEnabled ? "Show all categories" : "Hide private categories",
      group: "Actions",
      action: () => {
        togglePrivacy();
      },
    });

    items.push({
      id: "logout",
      label: "Logout",
      group: "Actions",
      action: () => {
        fetch("/api/auth/logout", { method: "POST" }).then(() => {
          router.replace("/login");
          router.refresh();
        });
      },
    });

    for (const cat of categories) {
      const count = entries.filter((e) => e.categoryId === cat.id).length;
      items.push({
        id: `cat-${cat.id}`,
        label: cat.name,
        hint: `${count} entries`,
        group: "Categories",
        action: () => {
          const el = document.getElementById(`category-${cat.id}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      });
    }

    for (const entry of entries) {
      items.push({
        id: `entry-${entry.id}`,
        label: entry.title,
        hint: entry.url.replace(/^https?:\/\//, ""),
        group: "Entries",
        action: () => {
          window.open(entry.url, "_blank", "noopener,noreferrer");
        },
      });
    }

    return items;
  }, [entries, categories, router, privacyEnabled, togglePrivacy]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        item.action();
        setOpen(false);
      }
    }
  }

  if (!open) return null;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  let runningIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden shadow-2xl"
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entries, categories, or actions..."
            className="flex-1 bg-transparent focus:outline-none"
            style={{ color: "var(--foreground)" }}
          />
          <kbd className="rounded border px-1.5 py-0.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[400px] overflow-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
              No results found
            </p>
          ) : (
            Object.entries(groups).map(([groupName, groupItems]) => (
              <div key={groupName}>
                <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--border-hover)" }}>
                  {groupName}
                </div>
                {groupItems.map((item) => {
                  const idx = runningIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition"
                      style={{
                        background: isSelected ? "var(--card-hover)" : "transparent",
                        color: isSelected ? "var(--foreground)" : "var(--muted)",
                      }}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.hint && (
                        <span className="ml-2 shrink-0 truncate text-xs" style={{ color: "var(--border-hover)" }}>
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--border-hover)" }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1 py-0.5" style={{ borderColor: "var(--border)" }}>↑</kbd>
              <kbd className="rounded border px-1 py-0.5" style={{ borderColor: "var(--border)" }}>↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border px-1 py-0.5" style={{ borderColor: "var(--border)" }}>↵</kbd>
              Select
            </span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
