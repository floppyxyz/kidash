import { NextRequest } from "next/server";

export function getAuthToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  const cookie = request.cookies.get("kidash_auth")?.value;
  if (cookie) {
    return cookie;
  }

  return null;
}

export function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.AUTH_TOKEN;
  if (!expected) return false;

  const provided = getAuthToken(request);
  if (!provided) return false;

  return provided === expected;
}
