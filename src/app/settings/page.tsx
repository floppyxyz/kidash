"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { usePrivacyMode } from "@/components/privacy-mode";

type Category = {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { enabled: privacyEnabled, remainingMs, enable, disable } = usePrivacyMode();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [pendingData, setPendingData] = useState<unknown>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  async function handleExport() {
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kidash-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Backup exported", "success");
    } catch {
      showToast("Export failed", "error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        setPendingData(data);
        setConfirmingImport(true);
      } catch {
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!pendingData) return;
    setImporting(true);
    try {
      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "Import failed", "error");
        return;
      }
      const result = await res.json();
      showToast(`Imported ${result.imported.categories} categories, ${result.imported.entries} entries`, "success");
      router.refresh();
    } catch {
      showToast("Import failed", "error");
    } finally {
      setImporting(false);
      setConfirmingImport(false);
      setPendingData(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-8">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm transition"
          style={{ color: "var(--muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Settings</h1>
      </header>

      <section
        className="mb-6 p-6"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Backup &amp; Restore</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Export all categories, entries, and layout to a JSON file. Re-import to restore on another instance.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Backup
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
        </div>
      </section>

      <section
        className="mb-6 p-6"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Health Checks</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Ping all entry URLs to check if services are reachable. Status dots appear on cards automatically.
        </p>
        <button
          onClick={async () => {
            setCheckingHealth(true);
            try {
              const res = await fetch("/api/health", { method: "POST" });
              if (!res.ok) throw new Error("Health check failed");
              const data = await res.json();
              showToast(`Checked ${data.checked} entries`, "success");
              router.refresh();
            } catch {
              showToast("Health check failed", "error");
            } finally {
              setCheckingHealth(false);
            }
          }}
          disabled={checkingHealth}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          onMouseEnter={(e) => { if (!checkingHealth) e.currentTarget.style.background = "var(--card-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={checkingHealth ? "animate-spin" : ""}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          {checkingHealth ? "Checking..." : "Run Health Check Now"}
        </button>
      </section>

      <section
        className="mb-6 p-6"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Privacy Mode</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Mark categories as private to hide them when Privacy Mode is active. Activate manually or with a timer.
        </p>

        {categories.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition"
                style={{ background: "var(--card-hover)" }}
              >
                <input
                  type="checkbox"
                  checked={cat.isPrivate}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setCategories((prev) =>
                      prev.map((c) => (c.id === cat.id ? { ...c, isPrivate: checked } : c))
                    );
                    await fetch("/api/categories/rename", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: cat.id, isPrivate: checked }),
                    });
                  }}
                  className="h-4 w-4"
                />
                <span style={{ color: "var(--foreground)" }}>{cat.name}</span>
                {cat.isPrivate && (
                  <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>private</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {privacyEnabled ? (
            <>
              <span className="text-sm font-medium" style={{ color: "#22c55e" }}>
                ● Active{remainingMs ? ` — ${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}` : ""}
              </span>
              <button
                onClick={() => disable()}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Disable Now
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => enable(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Enable (until off)
              </button>
              {[
                { label: "15 min", ms: 15 * 60 * 1000 },
                { label: "30 min", ms: 30 * 60 * 1000 },
                { label: "1 hour", ms: 60 * 60 * 1000 },
                { label: "2 hours", ms: 2 * 60 * 60 * 1000 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => enable(opt.ms)}
                  className="rounded-lg border px-3 py-2 text-sm transition"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}
        </div>
      </section>

      {confirmingImport && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => { setConfirmingImport(false); setPendingData(null); }}
        >
          <div
            className="w-full max-w-sm p-6 text-center"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4" style={{ color: "var(--foreground)" }}>
              This will <strong>replace all</strong> current categories and entries. Continue?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => { setConfirmingImport(false); setPendingData(null); }}
                className="rounded-lg border px-4 py-2 transition"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Replace"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
