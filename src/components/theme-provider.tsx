"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/toast";

type Theme = {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  customCss: string;
};

type ThemeContextValue = {
  currentTheme: string | null;
  selectTheme: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: null,
  selectTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => {
        const fetchedThemes: Theme[] = data.themes ?? [];
        setThemes(fetchedThemes);
        const cookie = document.cookie
          .split("; ")
          .find((c) => c.startsWith("kidash_theme="));
        const themeId = cookie ? cookie.split("=")[1] : null;
        if (themeId && fetchedThemes.some((t) => t.id === themeId)) {
          setCurrentTheme(themeId);
        } else if (fetchedThemes.length > 0) {
          setCurrentTheme(fetchedThemes[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentTheme || themes.length === 0) return;

    const theme = themes.find((t) => t.id === currentTheme);
    if (!theme) return;

    const root = document.documentElement;

    const allVars: Record<string, string> = {
      ...theme.colors,
      ...theme.fonts,
      ...theme.radius,
      ...theme.spacing,
    };

    Object.entries(allVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    let styleEl = document.getElementById("kidash-custom-css");
    if (theme.customCss) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "kidash-custom-css";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = theme.customCss;
    } else if (styleEl) {
      styleEl.textContent = "";
    }
  }, [currentTheme, themes]);

  async function selectTheme(id: string) {
    setCurrentTheme(id);
    const res = await fetch("/api/themes/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: id }),
    });
    if (res.ok) {
      const theme = themes.find((t) => t.id === id);
      showToast(`Theme: ${theme?.name ?? id}`, "success");
    }
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, selectTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSwitcher() {
  const { currentTheme, selectTheme } = useTheme();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data.themes ?? []))
      .catch(() => {});
  }, []);

  const currentThemeName = themes.find((t) => t.id === currentTheme)?.name ?? "Theme";

  return (
    <>
      <button
        onClick={() => setSelectorOpen(!selectorOpen)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
        title="Change theme"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
        </svg>
        {currentThemeName}
      </button>

      {selectorOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
          onClick={() => setSelectorOpen(false)}
        >
          <div
            className="w-full max-w-xs overflow-hidden shadow-2xl"
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Select Theme
            </div>
            <div className="py-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    selectTheme(theme.id);
                    setSelectorOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition"
                  style={{
                    background: theme.id === currentTheme ? "var(--card-hover)" : "transparent",
                    color: theme.id === currentTheme ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded border"
                      style={{ background: theme.colors["--background"], borderColor: "var(--border)" }}
                    />
                    {theme.name}
                  </span>
                  <span className="flex gap-1">
                    <span
                      className="h-3 w-3 rounded"
                      style={{ background: theme.colors["--accent"] }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
