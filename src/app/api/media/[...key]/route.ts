import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { readLocalObject } from "@/server/storage";

/** Serves PUBLIC media (images) for the local storage driver. Private files are never served here. */
export async function GET(_request: Request, ctx: RouteContext<"/api/media/[...key]">) {
  if (env.storageDriver !== "local") return new NextResponse(null, { status: 404 });
  const { key } = await ctx.params;
  const obj = await readLocalObject("public", key.map(decodeURIComponent).join("/"));
  if (!obj || !obj.contentType.startsWith("image/")) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(obj.bytes), {
    headers: { "Content-Type": obj.contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
