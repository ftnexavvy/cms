import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "blog_admin_session";

function isPublicApi(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return false;
  }

  if (request.nextUrl.pathname.startsWith("/api/auth/login")) {
    return true;
  }

  if (request.method === "GET" || request.method === "OPTIONS") {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicApi(request)) {
    return NextResponse.next();
  }

  const protectedPage = pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/api");
  if (!protectedPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
