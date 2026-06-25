"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function AddCategoryButton() {
  const router = useRouter();
  const { showToast } = useToast();
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
        showToast(data.error ?? "Failed to create category", "error");
        setSaving(false);
        return;
      }

      showToast("Category created", "success");
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
        id="add-category-btn"
        onClick={() => setAdding(true)}
        className="rounded-lg border border-dashed px-3 py-1.5 text-sm transition"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
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
        className="w-40 rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
          color: "var(--foreground)",
        }}
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"
        style={{ background: "var(--foreground)", color: "var(--background)" }}
      >
        {saving ? "..." : "Add"}
      </button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </form>
  );
}
