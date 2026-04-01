import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildLoginRedirectPath } from "@/lib/auth/redirects";

const publicPaths = [
  "/",
  "/features",
  "/contact",
  "/login",
  "/register-clinic",
  "/forgot-password"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  const nextPath = `${pathname}${request.nextUrl.search}`;

  requestHeaders.set("x-dentflow-pathname", pathname);
  requestHeaders.set("x-dentflow-search", request.nextUrl.search);

  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/accept-invitation/");

  if (isPublicPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  // Middleware performs a lightweight cookie precheck; server-side guards
  // still validate the signed session token before allowing protected actions.
  const sessionCookie = request.cookies.get("dentflow_session");
  const shouldRequireSessionCookie = process.env.DENTFLOW_DEMO_MODE === "false";

  if (!sessionCookie && shouldRequireSessionCookie) {
    const loginUrl = new URL(buildLoginRedirectPath({ next: nextPath }), request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"]
};
