import { createHmac } from "node:crypto";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/server/services/auth";
import type { ValidatedFile } from "@/server/uploads";
import type { PaystackTransaction } from "@/server/paystack";

export async function resetDatabase() {
  const tables = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function createUser(overrides: Partial<Prisma.UserCreateInput> = {}, password = "correct-horse-battery") {
  return db.user.create({
    data: { email: `user-${uid()}@example.com`, name: "Test User", passwordHash: await hashPassword(password), role: "USER", ...overrides },
  });
}

export async function createAdmin() {
  return createUser({ role: "ADMIN", email: `admin-${uid()}@example.com` });
}

export async function createCategory(name = `Category ${uid()}`) {
  return db.jobCategory.create({ data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } });
}

export function pdfFile(name = "cv.pdf"): ValidatedFile {
  const bytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF");
  return { bytes, kind: "pdf", mimeType: "application/pdf", fileName: name, size: bytes.length };
}

/** Minimal ZIP local-file header containing a word/document.xml entry. */
export function docxBytes(): Uint8Array {
  const name = new TextEncoder().encode("word/document.xml");
  const header = new Uint8Array(30 + name.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(26, name.length, true);
  header.set(name, 30);
  return header;
}

export function docxFile(name = "cv.docx"): ValidatedFile {
  const bytes = docxBytes();
  return {
    bytes,
    kind: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileName: name,
    size: bytes.length,
  };
}

export async function createOrder(userId: string, status: OrderStatus = "PENDING_PAYMENT", amountKobo = 600000) {
  const resume = await db.resume.create({
    data: { userId, fileKey: `resumes/${userId}/${uid()}/cv.pdf`, fileName: "cv.pdf", mimeType: "application/pdf", sizeBytes: 100 },
  });
  return db.resumeOrder.create({
    data: {
      orderNumber: `RO-TEST-${uid()}`,
      userId,
      resumeId: resume.id,
      targetRole: "Data Analyst",
      termsAcceptedAt: new Date(),
      amountKobo,
      status,
      paidAt: status === "PENDING_PAYMENT" ? null : new Date(),
    },
  });
}

export async function createPayment(userId: string, orderId: string, amountKobo = 600000) {
  return db.payment.create({
    data: { userId, orderId, reference: `REF-${uid()}`.toUpperCase(), amountKobo, currency: "NGN", status: "PENDING" },
  });
}

export function paystackTx(reference: string, overrides: Partial<PaystackTransaction> = {}): PaystackTransaction {
  return {
    id: Math.floor(Math.random() * 1e9),
    status: "success",
    reference,
    amount: 600000,
    currency: "NGN",
    channel: "card",
    gateway_response: "Successful",
    paid_at: new Date().toISOString(),
    ...overrides,
  };
}

export function signWebhook(body: string, secret = process.env.PAYSTACK_SECRET_KEY!) {
  return createHmac("sha512", secret).update(body).digest("hex");
}

export async function createJob(categoryId: string, overrides: Partial<Prisma.JobUncheckedCreateInput> = {}) {
  return db.job.create({
    data: {
      slug: `job-${uid()}`,
      title: "Support Specialist",
      companyName: "Acme Ltd",
      description: "A description that is long enough for validation purposes here.",
      categoryId,
      workMode: "REMOTE",
      locationEligibility: "Worldwide",
      nigeriaEligibility: "UNVERIFIED",
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      applyUrl: "https://acme.example.com/apply",
      status: "PUBLISHED",
      postedAt: new Date(),
      companyVerified: true,
      ...overrides,
    },
  });
}
