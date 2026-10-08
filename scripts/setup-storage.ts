/**
 * Creates the Supabase Storage buckets the app needs (safe to re-run):
 *   - "resumes" (PRIVATE): uploaded resumes and final deliverables, served only via signed URLs
 *   - "media"   (PUBLIC):  testimonial / story / article images
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/setup-storage.ts
 */
import { StorageClient } from "@supabase/storage-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}

const storage = new StorageClient(`${url.replace(/\/$/, "")}/storage/v1`, { apikey: key, Authorization: `Bearer ${key}` });
const buckets = [
  { name: process.env.SUPABASE_PRIVATE_BUCKET ?? "resumes", public: false, fileSizeLimit: "5MB", allowedMimeTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  { name: process.env.SUPABASE_PUBLIC_BUCKET ?? "media", public: true, fileSizeLimit: "2MB", allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"] },
];

async function main() {
  const { data: existing, error } = await storage.listBuckets();
  if (error) throw error;
  for (const b of buckets) {
    const found = existing.find((e) => e.name === b.name);
    const options = { public: b.public, fileSizeLimit: b.fileSizeLimit, allowedMimeTypes: b.allowedMimeTypes };
    const res = found ? await storage.updateBucket(b.name, options) : await storage.createBucket(b.name, options);
    if (res.error) throw res.error;
    console.log(`${found ? "updated" : "created"} bucket "${b.name}" (${b.public ? "public" : "PRIVATE"})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
