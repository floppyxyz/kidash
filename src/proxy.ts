import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login"]);
const PUBLIC_API_PREFIX = "/api/auth/";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    if (path.startsWith(PUBLIC_API_PREFIX)) {
      return NextResponse.next();
    }

    if (!process.env.AUTH_TOKEN) {
      return NextResponse.json(
        { error: "Server auth not configured. Set AUTH_TOKEN environment variable." },
        { status: 500 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(path)) {
    return NextResponse.next();
  }

  if (!process.env.AUTH_TOKEN) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (!isAuthorized(request)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
