import { promises as fs } from "fs";
import path from "path";

export type Theme = {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  radius: Record<string, string>;
  spacing: Record<string, string>;
  customCss: string;
};

export type ThemeFile = {
  name: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  radius?: Record<string, string>;
  spacing?: Record<string, string>;
  customCss?: string;
};

const THEMES_DIR = path.join(process.cwd(), "themes");

export async function getThemes(): Promise<Theme[]> {
  try {
    const files = await fs.readdir(THEMES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const themes: Theme[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(THEMES_DIR, file), "utf-8");
        const data: ThemeFile = JSON.parse(content);
        themes.push({
          id: file.replace(".json", ""),
          name: data.name ?? file.replace(".json", ""),
          colors: data.colors ?? {},
          fonts: data.fonts ?? {},
          radius: data.radius ?? {},
          spacing: data.spacing ?? {},
          customCss: data.customCss ?? "",
        });
      } catch {
        // skip invalid files
      }
    }

    return themes;
  } catch {
    return [];
  }
}

export async function getTheme(id: string): Promise<Theme | null> {
  const themes = await getThemes();
  return themes.find((t) => t.id === id) ?? null;
}
