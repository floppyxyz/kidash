"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { EntryIcon } from "@/components/entry-icon";
import { EditModal } from "@/components/edit-modal";
import { useToast } from "@/components/toast";
import { useViewMode } from "@/components/view-mode";

type EntryCardProps = {
  entry: {
    id: string;
    url: string;
    title: string;
    description: string | null;
    iconUrl: string | null;
    iconType: string | null;
    status: string | null;
    statusCheckedAt: Date | null;
    category: { name: string; slug: string } | null;
  };
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

function statusColor(status: string | null): string {
  if (status === "up") return "#22c55e";
  if (status === "down") return "#ef4444";
  return "#71717a";
}

export function EntryCard({ entry, onMoveUp, onMoveDown }: EntryCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { mode } = useViewMode();
  const compact = mode === "compact";
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Entry deleted", "success");
    } else {
      showToast("Failed to delete entry", "error");
    }
    router.refresh();
  }

  return (
    <>
      <div
        className={`group relative border transition ${compact ? "flex items-center gap-2 p-2" : "flex flex-col gap-2 p-4"}`}
        style={{
          borderRadius: "var(--radius-lg)",
          borderColor: "var(--border)",
          background: "var(--card)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.background = "var(--card-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--card)";
        }}
      >
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className={compact ? "flex min-w-0 items-center gap-2" : "flex flex-col gap-2"}
        >
          <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden ${compact ? "h-6 w-6" : "h-10 w-10"}`}
            style={{ borderRadius: "var(--radius-md)", background: "var(--card-hover)" }}
          >
            <EntryIcon iconUrl={entry.iconUrl} title={entry.title} />
            <span
              className="absolute bottom-0 right-0 rounded-full border-2"
              style={{
                width: compact ? "6px" : "10px",
                height: compact ? "6px" : "10px",
                background: statusColor(entry.status),
                borderColor: "var(--card)",
              }}
              title={entry.status ? `Status: ${entry.status}` : "Status: unknown"}
            />
          </div>
          <h3 className="truncate font-medium" style={{ color: "var(--foreground)" }}>{entry.title}</h3>
          {!compact && (
            <>
              <p className="line-clamp-2 min-h-[2.5rem] text-sm" style={{ color: "var(--muted)" }}>
                {entry.description ?? ""}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--muted)", opacity: 0.7 }}>{entry.url.replace(/^https?:\/\//, "")}</p>
            </>
          )}
        </a>

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveUp();
              }}
              className="rounded-md p-1.5 transition"
              style={{ background: "var(--card-hover)", color: "var(--muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
              title="Move up"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveDown();
              }}
              className="rounded-md p-1.5 transition"
              style={{ background: "var(--card-hover)", color: "var(--muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
              title="Move down"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded-md p-1.5 transition"
            style={{ background: "var(--card-hover)", color: "var(--muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="rounded-md p-1.5 transition"
            style={{ background: "var(--card-hover)", color: "var(--muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {editing && (
        <EditModal
          entry={entry}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}

      {confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmDelete(false)}
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
            <p className="mb-4" style={{ color: "var(--foreground)" }}>Delete &ldquo;{entry.title}&rdquo;?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border px-4 py-2 transition"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  handleDelete();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
