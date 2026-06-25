"use client";

import { createContext, useContext, useState } from "react";

type ViewMode = "detailed" | "compact";

type ViewModeContextValue = {
  mode: ViewMode;
  toggle: () => void;
  setMode: (mode: ViewMode) => void;
};

const ViewModeContext = createContext<ViewModeContextValue>({
  mode: "detailed",
  toggle: () => {},
  setMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeContext);
}

function readCookieMode(): ViewMode {
  if (typeof document === "undefined") return "detailed";
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("kidash_view_mode="));
  const saved = cookie ? cookie.split("=")[1] : null;
  return saved === "compact" || saved === "detailed" ? saved : "detailed";
}

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(readCookieMode);

  function setMode(next: ViewMode) {
    setModeState(next);
    document.cookie = `kidash_view_mode=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  function toggle() {
    setMode(mode === "detailed" ? "compact" : "detailed");
  }

  return (
    <ViewModeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function ViewModeToggle() {
  const { mode, toggle } = useViewMode();
  const isDetailed = mode === "detailed";

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition"
      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--card-hover)";
        e.currentTarget.style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--muted)";
      }}
      title={isDetailed ? "Switch to compact view" : "Switch to detailed view"}
    >
      {isDetailed ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      )}
      {isDetailed ? "Detailed" : "Compact"}
    </button>
  );
}
