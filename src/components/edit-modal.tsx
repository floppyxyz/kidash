"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/toast";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type EditModalProps = {
  entry: {
    id: string;
    url: string;
    title: string;
    description: string | null;
    category: { name: string; slug: string } | null;
  };
  onClose: () => void;
  onSaved: () => void;
};

export function EditModal({ entry, onClose, onSaved }: EditModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(entry.title);
  const [url, setUrl] = useState(entry.url);
  const [description, setDescription] = useState(entry.description ?? "");
  const [categorySlug, setCategorySlug] = useState(entry.category?.slug ?? "");
  const [categoryName, setCategoryName] = useState(entry.category?.name ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
      })
      .catch(() => {});
  }, []);

  function selectCategory(slug: string, name: string) {
    setCategorySlug(slug);
    setCategoryName(name);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          description: description || null,
          categorySlug,
          categoryName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
        showToast(data.error ?? "Failed to save", "error");
        setSaving(false);
        return;
      }

      showToast("Entry saved", "success");
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6"
        style={{
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Edit entry</h2>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 focus:outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 focus:outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 focus:outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--muted)" }}>Category</label>
            <select
              value={categorySlug}
              onChange={(e) => {
                const cat = categories.find((c) => c.slug === e.target.value);
                if (cat) selectCategory(cat.slug, cat.name);
              }}
              className="w-full px-3 py-2 focus:outline-none"
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                color: "var(--foreground)",
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 transition"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-4 py-2 font-medium transition disabled:opacity-50"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
