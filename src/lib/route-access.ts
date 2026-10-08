export type RouteDecision = "allow" | "adminLogin" | "forbidden";

/**
 * Server-side route gate used by proxy.ts — legacy admin area only.
 *
 * The candidate area (/dashboard) is NOT gated here: candidates authenticate against the
 * Laravel API with a bearer token held in the browser (no cookies), which the server can't
 * see. The dashboard guards itself client-side and Laravel authorizes every API call.
 */
export function routeAccess(pathname: string, session: { adminRole: "USER" | "ADMIN" | null }): RouteDecision {
  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = !isAdminLogin && (pathname === "/admin" || pathname.startsWith("/admin/"));
  if (!isAdminArea) return "allow";
  if (!session.adminRole) return "adminLogin";
  return session.adminRole === "ADMIN" ? "allow" : "forbidden";
}
