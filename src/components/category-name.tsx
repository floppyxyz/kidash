"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

type CategoryNameProps = {
  category: { id: string; name: string };
};

export function CategoryName({ category }: CategoryNameProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [value, setValue] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleDelete() {
    setError(null);
    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Category deleted", "success");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete");
      showToast(data.error ?? "Failed to delete", "error");
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
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
          className="rounded border px-2 py-0.5 text-sm font-semibold uppercase tracking-wider focus:outline-none"
          style={{
            borderColor: "var(--border-hover)",
            background: "var(--card-hover)",
            color: "var(--foreground)",
          }}
        />
      ) : confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Delete &ldquo;{category.name}&rdquo;?
          </span>
          <button
            onClick={handleDelete}
            className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-500"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded border px-2 py-0.5 text-xs transition"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-semibold uppercase tracking-wider transition"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
        >
          {category.name}
        </button>
      )}

      {!editing && !confirmDelete && (
        <button
          onClick={() => setConfirmDelete(true)}
          className="transition hover:text-red-500"
          style={{ color: "var(--border)" }}
          title="Delete category"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
