"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

type PrivacyModeContextValue = {
  enabled: boolean;
  expiresAt: number | null;
  enable: (durationMs: number | null) => void;
  disable: () => void;
  toggle: () => void;
  remainingMs: number | null;
};

const PrivacyModeContext = createContext<PrivacyModeContextValue>({
  enabled: false,
  expiresAt: null,
  enable: () => {},
  disable: () => {},
  toggle: () => {},
  remainingMs: null,
});

export function usePrivacyMode() {
  return useContext(PrivacyModeContext);
}

const COOKIE_NAME = "kidash_privacy";

function readCookieState(): { enabled: boolean; expiresAt: number | null } {
  if (typeof document === "undefined") return { enabled: false, expiresAt: null };
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return { enabled: false, expiresAt: null };
  const value = cookie.split("=")[1];
  if (value === "1") return { enabled: true, expiresAt: null };
  if (value.startsWith("t:")) {
    const expiresAt = parseInt(value.slice(2), 10);
    if (Date.now() < expiresAt) return { enabled: true, expiresAt };
  }
  return { enabled: false, expiresAt: null };
}

function writeCookie(enabled: boolean, expiresAt: number | null) {
  if (!enabled) {
    document.cookie = `${COOKIE_NAME}=0; path=/; max-age=0; samesite=lax`;
    return;
  }
  if (expiresAt) {
    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    document.cookie = `${COOKIE_NAME}=t:${expiresAt}; path=/; max-age=${maxAge}; samesite=lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
}

export function PrivacyModeProvider({ children }: { children: React.ReactNode }) {
  const initial = readCookieState();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [expiresAt, setExpiresAt] = useState<number | null>(initial.expiresAt);
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enable = useCallback((durationMs: number | null) => {
    const exp = durationMs ? Date.now() + durationMs : null;
    setEnabled(true);
    setExpiresAt(exp);
    writeCookie(true, exp);
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    setExpiresAt(null);
    writeCookie(false, null);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      disable();
    } else {
      enable(null);
    }
  }, [enabled, enable, disable]);

  const remainingMs = enabled && expiresAt ? Math.max(0, expiresAt - now) : null;

  useEffect(() => {
    if (!enabled || !expiresAt) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkExpiry = () => {
      if (Date.now() >= expiresAt) {
        writeCookie(false, null);
        setEnabled(false);
        setExpiresAt(null);
      }
    };

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
      checkExpiry();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, expiresAt]);

  return (
    <PrivacyModeContext.Provider value={{ enabled, expiresAt, enable, disable, toggle, remainingMs }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}
