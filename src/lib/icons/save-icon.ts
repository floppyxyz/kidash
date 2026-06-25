import { promises as fs } from "fs";
import path from "path";

const ICONS_DIR = path.join(process.cwd(), "public", "icons", "library");

export async function saveLibraryIcon(
  slug: string,
  svg: string
): Promise<string> {
  try {
    await fs.mkdir(ICONS_DIR, { recursive: true });
  } catch {
    // directory might already exist
  }

  const filename = `${slug}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  try {
    await fs.access(filepath);
  } catch {
    await fs.writeFile(filepath, svg, "utf-8");
  }

  return `/icons/library/${filename}`;
}
