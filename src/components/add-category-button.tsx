"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCategoryButton() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create category");
        setSaving(false);
        return;
      }

      setName("");
      setAdding(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
      >
        + Category
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        autoFocus
        onBlur={() => {
          if (!name.trim()) setAdding(false);
        }}
        className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {saving ? "..." : "Add"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
