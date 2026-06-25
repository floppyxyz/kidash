import * as simpleIcons from "simple-icons";

type SimpleIcon = {
  slug: string;
  title: string;
  hex: string;
  svg: string;
};

export function siSlug(slug: string): SimpleIcon | null {
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const key of Object.keys(simpleIcons)) {
    const icon = (simpleIcons as Record<string, unknown>)[key] as SimpleIcon;
    if (
      icon &&
      typeof icon === "object" &&
      "slug" in icon &&
      icon.slug === normalized
    ) {
      return icon;
    }
  }

  for (const key of Object.keys(simpleIcons)) {
    const icon = (simpleIcons as Record<string, unknown>)[key] as SimpleIcon;
    if (
      icon &&
      typeof icon === "object" &&
      "title" in icon &&
      icon.title.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
    ) {
      return icon;
    }
  }

  return null;
}
