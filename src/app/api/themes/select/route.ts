import { NextResponse } from "next/server";
import { getThemes } from "@/lib/themes";

export async function POST(request: Request) {
  let body: { theme?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const themeId = body.theme?.trim();
  if (!themeId) {
    return NextResponse.json({ error: "Theme is required" }, { status: 400 });
  }

  const themes = await getThemes();
  const exists = themes.some((t) => t.id === themeId);
  if (!exists) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true, theme: themeId });
  response.cookies.set("kidash_theme", themeId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
