"use client";

import { useState } from "react";

type EntryIconProps = {
  iconUrl: string | null;
  title: string;
};

export function EntryIcon({ iconUrl, title }: EntryIconProps) {
  const [errored, setErrored] = useState(false);

  if (!iconUrl || errored || iconUrl === "data:,") {
    return (
      <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>
        {title.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={iconUrl}
      alt=""
      className="h-7 w-7"
      onError={() => setErrored(true)}
    />
  );
}
