import { NextResponse } from "next/server";
import { getThemes } from "@/lib/themes";

export async function GET() {
  const themes = await getThemes();
  return NextResponse.json({ themes });
}
