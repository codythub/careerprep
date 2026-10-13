/**
 * Opt-in contract check against a RUNNING Laravel CareerPrep API, using the frontend's own client.
 * Skipped unless LARAVEL_LIVE_URL is set, e.g.:
 *
 *   LARAVEL_LIVE_URL=http://127.0.0.1:8000 npx vitest run tests/laravel-live.test.ts
 *
 * It registers a throwaway user, so never point it at production. Paystack checkout can't be
 * completed from a test, so payment success is not covered here.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/laravel/api";
import { ApiError, laravel } from "@/lib/laravel/client";
import { ENDPOINTS, RESUME_UPLOAD_FIELD } from "@/lib/laravel/config";
import { toResume } from "@/lib/laravel/types";

const LIVE = process.env.LARAVEL_LIVE_URL;

/** Minimal one-page PDF; with `text` it has a readable text layer, without it there is nothing to extract. */
function pdf(text?: string): Blob {
  const stream = text ? `BT /F1 12 Tf 72 720 Td (${text}) Tj ET` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([body], { type: "application/pdf" });
}

/** Same request the browser's XHR upload sends: multipart field "resume" with the bearer token. */
async function upload(token: string, file: Blob, name: string) {
  const form = new FormData();
  form.append(RESUME_UPLOAD_FIELD, file, name);
  return toResume(await laravel(ENDPOINTS.resumes, { method: "POST", token, formData: form }))!;
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => {
      throw new Error("expected the call to fail");
    },
    (e: unknown) => e as ApiError,
  );

describe.skipIf(!LIVE)("live Laravel API", () => {
  const email = `live-${Date.now()}@example.com`;
  const password = "live-test-password-1";
  let token = "";

  beforeAll(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", LIVE!);
  });

  it("registers, validates input with 422 field errors, and reads the user", async () => {
    const invalid = await failure(api.register({ name: "", email: "not-an-email", password: "x", password_confirmation: "y" }));
    expect(invalid.status).toBe(422);
    expect(Object.keys(invalid.fieldErrors)).toEqual(expect.arrayContaining(["name", "email", "password"]));

    const auth = await api.register({ name: "Live Test", email, password, password_confirmation: password });
    expect(auth.token).toBeTruthy();
    token = auth.token;
    expect((await api.user(token)).email).toBe(email);
  });

  it("logs in, rejects wrong credentials, and logout revokes only that token", async () => {
    expect((await failure(api.login({ email, password: "wrong-password" }))).fieldErrors.email).toBeDefined();
    const second = (await api.login({ email, password })).token;
    await api.logout(second);
    expect((await failure(api.user(second))).isUnauthorized).toBe(true);
    expect((await api.user(token)).email).toBe(email);
  });

  it("reads and updates the profile", async () => {
    const saved = await api.updateProfile(token, { name: "Live Tester", email, phone: "0800", location: "Lagos", professional_title: "Analyst" });
    expect(saved?.professionalTitle).toBe("Analyst");
    expect((await api.getProfile(token)).location).toBe("Lagos");
  });

  it("uploads PDFs, reports text extraction, lists, reads and deletes resumes", async () => {
    const readable = await upload(token, pdf("Ada Obi Customer Success Specialist Lagos Nigeria"), "readable.pdf");
    expect(readable.fileName).toBe("readable.pdf");
    expect(readable.extractionStatus).toBe("succeeded");
    const blank = await upload(token, pdf(), "blank.pdf");
    expect(blank.extractionStatus).toBe("failed");

    const list = await api.listResumes(token);
    expect(list.items.map((r) => r.id)).toEqual(expect.arrayContaining([readable.id, blank.id]));
    expect((await api.getResume(token, readable.id)).sizeBytes).toBeGreaterThan(0);

    const notPdf = await failure(upload(token, new Blob(["hello"], { type: "text/plain" }), "notes.txt"));
    expect(notPdf.status).toBe(422);

    await api.deleteResume(token, blank.id);
    expect((await failure(api.getResume(token, blank.id))).status).toBe(404);
  });

  it("keeps payments and reviews scoped to the candidate and enforces entitlements", async () => {
    expect((await api.listPayments(token)).items).toEqual([]);
    expect(await api.findPaymentByReference(token, "CP-DOES-NOT-EXIST")).toBeNull();
    expect((await failure(api.createReview(token, 999999))).status).toBe(422);
    expect((await api.listReviews(token, 1, (await api.listResumes(token)).items[0]!.id)).items).toEqual([]);
  });

  it("rejects requests without a valid token", async () => {
    expect((await failure(api.listResumes("invalid-token"))).isUnauthorized).toBe(true);
  });
});
