import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { readLocalObject, verifyLocalSignature } from "@/server/storage";

/** Development-only signed download endpoint for the local storage driver. */
export async function GET(request: Request) {
  if (env.storageDriver !== "local") return new NextResponse(null, { status: 404 });
  const p = new URL(request.url).searchParams;
  const key = p.get("key") ?? "";
  const name = p.get("name") ?? "file";
  const exp = Number(p.get("exp"));
  const sig = p.get("sig") ?? "";
  if (!verifyLocalSignature(key, exp, name, sig)) {
    return NextResponse.json({ error: "This download link has expired. Please try again from your dashboard." }, { status: 403 });
  }
  const obj = await readLocalObject("private", key);
  if (!obj) return NextResponse.json({ error: "File not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(obj.bytes), {
    headers: {
      "Content-Type": obj.contentType,
      "Content-Disposition": `attachment; filename="${name.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
