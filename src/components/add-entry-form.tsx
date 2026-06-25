"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddEntryForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add entry");
        setLoading(false);
        return;
      }

      setUrl("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL or IP (e.g. nextcloud.local or 192.168.1.5:8080)"
        disabled={loading}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="rounded-lg bg-zinc-100 px-5 py-2.5 font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
