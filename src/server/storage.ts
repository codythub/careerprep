import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageClient } from "@supabase/storage-js";
import { env } from "@/lib/env";

/**
 * Storage abstraction.
 *  - "private" bucket: resumes + deliverables. Never public; only short-lived signed URLs.
 *  - "public" bucket: testimonial/story/article images.
 * Production uses Supabase Storage. Local development falls back to the filesystem
 * with HMAC-signed, expiring download URLs so the same security model is exercised.
 */
export type Bucket = "private" | "public";

const BUCKET_NAMES: Record<Bucket, string> = {
  private: process.env.SUPABASE_PRIVATE_BUCKET ?? "resumes",
  public: process.env.SUPABASE_PUBLIC_BUCKET ?? "media",
};

export const SIGNED_URL_TTL_SECONDS = 60;
const LOCAL_ROOT = path.join(process.cwd(), ".local-storage");

// Storage-only client: no auth/realtime machinery (which needs Node 22 WebSockets).
let storage: StorageClient | null = null;
function client(): { storage: StorageClient } {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  storage ??= new StorageClient(`${env.supabaseUrl.replace(/\/$/, "")}/storage/v1`, {
    apikey: env.supabaseServiceRoleKey,
    Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
  });
  return { storage };
}

function assertDriverAllowed() {
  if (env.storageDriver === "local" && env.isProduction && process.env.ALLOW_LOCAL_STORAGE !== "true") {
    throw new Error("Local file storage is disabled in production. Configure Supabase Storage.");
  }
}

export function buildObjectKey(prefix: string, fileName: string): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "");
  return `${safePrefix}/${randomUUID()}/${fileName}`;
}

export async function putObject(bucket: Bucket, key: string, bytes: Uint8Array, contentType: string): Promise<void> {
  assertDriverAllowed();
  if (env.storageDriver === "supabase") {
    const { error } = await client()
      .storage.from(BUCKET_NAMES[bucket])
      .upload(key, bytes, { contentType, upsert: false, cacheControl: bucket === "public" ? "31536000" : "0" });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return;
  }
  const file = localPath(bucket, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  await writeFile(`${file}.meta`, JSON.stringify({ contentType }));
}

export async function deleteObject(bucket: Bucket, key: string): Promise<void> {
  if (env.storageDriver === "supabase") {
    await client().storage.from(BUCKET_NAMES[bucket]).remove([key]);
    return;
  }
  await rm(localPath(bucket, key), { force: true });
  await rm(`${localPath(bucket, key)}.meta`, { force: true });
}

/**
 * Short-lived download URL for a private object. Callers MUST check ownership first.
 */
export async function createSignedDownloadUrl(key: string, downloadName: string): Promise<string> {
  assertDriverAllowed();
  if (env.storageDriver === "supabase") {
    const { data, error } = await client()
      .storage.from(BUCKET_NAMES.private)
      .createSignedUrl(key, SIGNED_URL_TTL_SECONDS, { download: downloadName });
    if (error || !data) throw new Error(`Could not sign URL: ${error?.message}`);
    return data.signedUrl;
  }
  const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const sig = signLocal(key, exp, downloadName);
  const params = new URLSearchParams({ key, exp: String(exp), name: downloadName, sig });
  return `/api/storage/local?${params.toString()}`;
}

export function publicObjectUrl(key: string): string {
  if (env.storageDriver === "supabase") {
    return client().storage.from(BUCKET_NAMES.public).getPublicUrl(key).data.publicUrl;
  }
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

// ── Local driver helpers (development only) ──────────────────────────────────

export function signLocal(key: string, exp: number, name: string): string {
  return createHmac("sha256", env.storageSigningSecret).update(`${key}\n${exp}\n${name}`).digest("hex");
}

export function verifyLocalSignature(key: string, exp: number, name: string, sig: string): boolean {
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signLocal(key, exp, name), "hex");
  const given = Buffer.from(sig, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function readLocalObject(bucket: Bucket, key: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const file = localPath(bucket, key);
    const bytes = await readFile(file);
    const meta = JSON.parse(await readFile(`${file}.meta`, "utf8")) as { contentType: string };
    return { bytes, contentType: meta.contentType };
  } catch {
    return null;
  }
}

function localPath(bucket: Bucket, key: string): string {
  const root = path.join(LOCAL_ROOT, bucket);
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return resolved;
}
