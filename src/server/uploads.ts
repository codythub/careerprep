import { siteConfig } from "@/config/site";
import { UserError } from "@/server/errors";

export type ResumeFileKind = "pdf" | "docx";

export const RESUME_MIME: Record<ResumeFileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const IMAGE_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;
export type ImageKind = keyof typeof IMAGE_MIME;

/**
 * Identify a resume by its bytes, not its name or the browser-supplied type.
 * PDF: "%PDF-" header. DOCX: ZIP container whose entries include word/document.xml.
 */
export function sniffResume(bytes: Uint8Array): ResumeFileKind | null {
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "pdf";
  const isZip = bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (isZip && zipHasEntry(bytes, "word/document.xml")) return "docx";
  return null;
}

export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  return null;
}

export type ValidatedFile = {
  bytes: Uint8Array;
  kind: string;
  mimeType: string;
  fileName: string;
  size: number;
};

export async function validateResumeUpload(file: unknown): Promise<ValidatedFile> {
  if (!(file instanceof File) || file.size === 0) throw new UserError("Please choose your resume file to upload.");
  const max = siteConfig.resumeOptimization.maxUploadBytes;
  if (file.size > max) throw new UserError(`Your file is too large. The maximum size is ${Math.round(max / 1024 / 1024)} MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffResume(bytes);
  if (!kind) throw new UserError("Please upload a PDF or Word (.docx) document. Other file types are not accepted.");
  return { bytes, kind, mimeType: RESUME_MIME[kind], fileName: safeFileName(file.name, kind), size: file.size };
}

export async function validateImageUpload(file: unknown, maxBytes = 2 * 1024 * 1024): Promise<ValidatedFile | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > maxBytes) throw new UserError("Images must be 2 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new UserError("Please upload a PNG, JPEG or WebP image.");
  return { bytes, kind, mimeType: IMAGE_MIME[kind], fileName: safeFileName(file.name, kind), size: file.size };
}

/** Strip paths and unusual characters; force the extension that matches the sniffed type. */
export function safeFileName(original: string, ext: string): string {
  const base = original
    .split(/[\\/]/)
    .pop()!
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${base || "file"}.${ext}`;
}

function ascii(bytes: Uint8Array, start: number, len: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + len));
}

/** Scan ZIP local file headers for an entry name (no decompression needed). */
function zipHasEntry(bytes: Uint8Array, name: string): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  let guard = 0;
  while (offset + 30 <= bytes.length && guard++ < 5000) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const flags = view.getUint16(offset + 6, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const entry = ascii(bytes, offset + 30, nameLen);
    if (entry === name) return true;
    // Bit 3 = sizes stored in a trailing data descriptor; fall back to a raw search.
    if (flags & 0x08) return rawIncludes(bytes, name);
    offset += 30 + nameLen + extraLen + compressedSize;
  }
  return rawIncludes(bytes, name);
}

function rawIncludes(bytes: Uint8Array, needle: string): boolean {
  const n = new TextEncoder().encode(needle);
  outer: for (let i = 0; i <= bytes.length - n.length; i++) {
    for (let j = 0; j < n.length; j++) if (bytes[i + j] !== n[j]) continue outer;
    return true;
  }
  return false;
}
