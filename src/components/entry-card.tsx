"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EntryIcon } from "@/components/entry-icon";
import { EditModal } from "@/components/edit-modal";

type EntryCardProps = {
  entry: {
    id: string;
    url: string;
    title: string;
    description: string | null;
    iconUrl: string | null;
    iconType: string | null;
    category: { name: string; slug: string } | null;
  };
};

export function EntryCard({ entry }: EntryCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    borderColor: isDragging ? "var(--color-zinc-500)" : undefined,
  };

  async function handleDelete() {
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex flex-col gap-2 rounded-xl border p-4 transition touch-none ${
          isDragging
            ? "border-zinc-500 bg-zinc-800 shadow-lg shadow-black/50"
            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900"
        }`}
      >
        <div
          className="absolute left-0.5 top-1/2 z-10 -translate-y-1/2 cursor-grab rounded p-1 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>

        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
              <EntryIcon iconUrl={entry.iconUrl} title={entry.title} />
            </div>
            <h3 className="truncate font-medium text-zinc-100">{entry.title}</h3>
          </div>
          <p className="line-clamp-2 min-h-[2.5rem] text-sm text-zinc-400">
            {entry.description ?? ""}
          </p>
          <p className="truncate text-xs text-zinc-600">{entry.url.replace(/^https?:\/\//, "")}</p>
        </a>

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditing(true);
            }}
            className="rounded-md bg-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
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
            className="rounded-md bg-zinc-800 p-1.5 text-zinc-400 hover:bg-red-900 hover:text-red-300"
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

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-zinc-200">Delete &ldquo;{entry.title}&rdquo;?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-800"
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
        </div>
      )}
    </>
  );
}
