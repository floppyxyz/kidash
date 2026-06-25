"use client";

import { usePrivacyMode } from "@/components/privacy-mode";

export function PrivacyModeToggle() {
  const { enabled, toggle, remainingMs } = usePrivacyMode();

  const remainingLabel = remainingMs
    ? `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`
    : null;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition"
      style={{
        borderColor: enabled ? "#22c55e" : "var(--border)",
        color: enabled ? "#22c55e" : "var(--muted)",
        background: enabled ? "rgba(34, 197, 94, 0.1)" : "transparent",
      }}
      title={enabled ? "Privacy mode ON — private categories hidden" : "Enable privacy mode"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {enabled ? (
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
      {enabled ? (remainingLabel ? `Privacy ${remainingLabel}` : "Privacy") : "Privacy"}
    </button>
  );
}
