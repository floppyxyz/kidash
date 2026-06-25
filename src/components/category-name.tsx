"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type CategoryNameProps = {
  category: { id: string; name: string };
};

export function CategoryName({ category }: CategoryNameProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      setValue(category.name);
      return;
    }

    setSaving(true);
    try {
      await fetch("/api/categories/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          name: trimmed,
        }),
      });
      router.refresh();
    } catch {
      setValue(category.name);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(category.name);
            setEditing(false);
          }
        }}
        disabled={saving}
        className="mb-3 rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-sm font-semibold uppercase tracking-wider text-zinc-300 focus:border-zinc-400 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 transition hover:text-zinc-300"
    >
      {category.name}
    </button>
  );
}
