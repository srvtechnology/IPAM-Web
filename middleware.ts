import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth/jwt";
import { ADMIN_COOKIE } from "@/lib/auth/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin login page (and its API route, which lives outside this matcher
  // under /api/auth/admin/login) must be reachable unauthenticated.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const payload = token ? await verifyAdminToken(token) : null;

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-admin-id", payload.sub);

  return NextResponse.next({ request: { headers: requestHeaders } });
}
