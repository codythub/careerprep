import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import { deliverableDownloadUrl, resumeDownloadUrl } from "@/server/services/orders";

/**
 * Authenticated download gateway. Checks ownership (or admin role), then redirects
 * to a short-lived signed URL. Permanent file URLs are never exposed.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/files/[kind]/[id]">) {
  const { kind, id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(new URL(request.url).pathname)}`, request.url), 303);

  let url: string | null = null;
  if (kind === "resume") url = await resumeDownloadUrl(user, id);
  else if (kind === "deliverable") url = await deliverableDownloadUrl(user, id);

  // Same response for "missing" and "forbidden" so IDs can't be probed.
  if (!url) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const res = NextResponse.redirect(new URL(url, request.url), 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
