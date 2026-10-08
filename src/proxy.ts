import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { routeAccess } from "@/lib/route-access";

// Legacy admin session (admin area only). Candidates authenticate against Laravel with a
// browser-held bearer token, so /dashboard is guarded client-side, not here.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  // Build redirects from the real Host (Auth.js rewrites req.url to AUTH_URL), so any host/port works.
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const here = new URL(`${proto}://${host}`);
  const decision = routeAccess(pathname, { adminRole: req.auth?.user?.role ?? null });

  if (decision === "adminLogin") {
    const url = new URL("/admin/login", here);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if (decision === "forbidden") return NextResponse.rewrite(new URL("/not-found-page", here), { status: 404 });

  const res = NextResponse.next();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "private, no-store");
  }
  return res;
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
