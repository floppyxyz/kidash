"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { EditModal } from "@/components/edit-modal";

type CreatedEntry = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  category: { name: string; slug: string } | null;
};

export function AddEntryForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<CreatedEntry | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setStatus("Fetching metadata...");
    setLoading(true);

    try {
      setStatus("Analyzing with AI...");

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Failed to add entry", "error");
        setStatus(null);
        setLoading(false);
        return;
      }

      setStatus("Resolving icon...");
      setUrl("");
      setStatus(null);

      const data = await res.json();
      router.refresh();

      if (data.needsEditing && data.entry) {
        showToast("No metadata found — please edit manually", "info");
        setEditEntry(data.entry);
      } else {
        showToast("Entry added", "success");
      }
    } catch {
      showToast("Network error", "error");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form id="add-entry-form" onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="add-entry-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL or IP (e.g. nextcloud.local or 192.168.1.5:8080)"
          disabled={loading}
          className="flex-1 px-4 py-2.5 focus:outline-none focus:ring-1 disabled:opacity-60"
          style={{
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-lg px-5 py-2.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          Add
        </button>
      </form>

      {loading && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-sm p-8 text-center"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full" style={{ border: "2px solid var(--border)", borderTopColor: "var(--foreground)" }} />
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{status}</p>
          </div>
        </div>,
        document.body
      )}

      {editEntry && (
        <EditModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={() => {
            setEditEntry(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
