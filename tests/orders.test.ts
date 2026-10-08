import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { UserError } from "@/server/errors";
import { sniffImage, sniffResume, safeFileName, validateResumeUpload } from "@/server/uploads";
import { verifyLocalSignature } from "@/server/storage";
import {
  adminChangeOrderStatus,
  adminUploadDeliverable,
  cancelPendingOrder,
  createResumeOrder,
  deliverableDownloadUrl,
  resumeDownloadUrl,
} from "@/server/services/orders";
import { canTransition } from "@/server/services/order-status";
import { setSetting } from "@/server/services/settings";
import { createAdmin, createOrder, createUser, docxBytes, docxFile, pdfFile } from "./helpers";

const input = { targetRole: "Product Manager", acceptTerms: true };

describe("order creation", () => {
  it("creates a PENDING_PAYMENT order with the server-side price snapshot", async () => {
    const user = await createUser();
    await setSetting("resume_price_kobo", 600000);
    const order = await createResumeOrder(user.id, input, { file: pdfFile() });
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.amountKobo).toBe(600000);
    expect(order.orderNumber).toMatch(/^RO-\d{4}-[A-Z0-9]{6}$/);
    expect(order.termsAcceptedAt).toBeInstanceOf(Date);

    // Changing the price later never changes existing orders.
    await setSetting("resume_price_kobo", 900000);
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).amountKobo).toBe(600000);
    const next = await createResumeOrder(user.id, input, { resumeId: order.resumeId });
    expect(next.amountKobo).toBe(900000);
  });

  it("requires accepted terms and a resume", async () => {
    const user = await createUser();
    await expect(createResumeOrder(user.id, { ...input, acceptTerms: false }, { file: pdfFile() })).rejects.toBeInstanceOf(UserError);
    await expect(createResumeOrder(user.id, input, {})).rejects.toThrow(/upload your current resume/);
  });

  it("does not allow using another user's resume", async () => {
    const owner = await createUser();
    const attacker = await createUser();
    const order = await createResumeOrder(owner.id, input, { file: pdfFile() });
    await expect(createResumeOrder(attacker.id, input, { resumeId: order.resumeId })).rejects.toThrow(/choose one of your uploaded resumes/);
  });

  it("customers can cancel only their own unpaid orders", async () => {
    const owner = await createUser();
    const other = await createUser();
    const order = await createOrder(owner.id);
    await expect(cancelPendingOrder(other.id, order.id)).rejects.toBeInstanceOf(UserError);
    await cancelPendingOrder(owner.id, order.id);
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    const paid = await createOrder(owner.id, "PAID");
    await expect(cancelPendingOrder(owner.id, paid.id)).rejects.toBeInstanceOf(UserError);
  });
});

describe("status transitions", () => {
  it("follows the allowed transition map", () => {
    expect(canTransition("PAID", "RECEIVED")).toBe(true);
    expect(canTransition("RECEIVED", "IN_REVIEW")).toBe(true);
    expect(canTransition("COMPLETED", "DELIVERED")).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(false); // only verified payments
    expect(canTransition("PENDING_PAYMENT", "PROCESSING")).toBe(false);
    expect(canTransition("DELIVERED", "PAID")).toBe(false);
    expect(canTransition("REFUNDED", "PROCESSING")).toBe(false);
  });

  it("admin moves an order forward, records history, audit and notifies the customer", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const order = await createOrder(user.id, "PAID");
    await adminChangeOrderStatus(admin, order.id, "RECEIVED", "Picked up");
    const updated = await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("RECEIVED");
    expect(updated.assignedToId).toBe(admin.id);
    expect(await db.orderStatusHistory.count({ where: { orderId: order.id, toStatus: "RECEIVED" } })).toBe(1);
    expect(await db.auditLog.count({ where: { entityId: order.id, action: "order.status" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: user.id } })).toBe(1);
  });

  it("rejects invalid transitions and non-admin actors", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const order = await createOrder(user.id, "PENDING_PAYMENT");
    await expect(adminChangeOrderStatus(admin, order.id, "PROCESSING")).rejects.toThrow(/cannot move/);
    const paid = await createOrder(user.id, "PAID");
    await expect(adminChangeOrderStatus({ id: user.id, role: "USER" }, paid.id, "RECEIVED")).rejects.toThrow(/permission/);
  });

  it("cannot mark DELIVERED without an uploaded final file", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const order = await createOrder(user.id, "COMPLETED");
    await expect(adminChangeOrderStatus(admin, order.id, "DELIVERED")).rejects.toThrow(/Upload the final resume/);
    await adminUploadDeliverable(admin, order.id, "PDF", pdfFile("final.pdf"));
    await adminChangeOrderStatus(admin, order.id, "DELIVERED");
    const delivered = await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(delivered.status).toBe("DELIVERED");
    expect(delivered.deliveredAt).not.toBeNull();
  });

  it("deliverable type must match the file's real contents", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const order = await createOrder(user.id, "PROCESSING");
    await expect(adminUploadDeliverable(admin, order.id, "DOCX", pdfFile())).rejects.toThrow(/not a valid Word/);
    const d = await adminUploadDeliverable(admin, order.id, "DOCX", docxFile());
    expect(d.version).toBe(1);
    const unpaid = await createOrder(user.id, "PENDING_PAYMENT");
    await expect(adminUploadDeliverable(admin, unpaid.id, "PDF", pdfFile())).rejects.toThrow(/paid orders/);
  });
});

describe("file access", () => {
  it("only the owner (or an admin) can get a resume download URL", async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const admin = await createAdmin();
    const order = await createResumeOrder(owner.id, input, { file: pdfFile() });
    const url = await resumeDownloadUrl(owner, order.resumeId);
    expect(url).toMatch(/^\/api\/storage\/local\?/);
    expect(await resumeDownloadUrl(stranger, order.resumeId)).toBeNull();
    expect(await resumeDownloadUrl(admin, order.resumeId)).not.toBeNull();
  });

  it("signed URLs expire and cannot be tampered with", async () => {
    const owner = await createUser();
    const order = await createResumeOrder(owner.id, input, { file: pdfFile() });
    const url = new URL((await resumeDownloadUrl(owner, order.resumeId))!, "http://x");
    const p = url.searchParams;
    expect(verifyLocalSignature(p.get("key")!, Number(p.get("exp")), p.get("name")!, p.get("sig")!)).toBe(true);
    expect(verifyLocalSignature(`${p.get("key")}x`, Number(p.get("exp")), p.get("name")!, p.get("sig")!)).toBe(false);
    expect(verifyLocalSignature(p.get("key")!, Math.floor(Date.now() / 1000) - 1, p.get("name")!, p.get("sig")!)).toBe(false);
  });

  it("customers can download final files only once the order is delivered", async () => {
    const admin = await createAdmin();
    const owner = await createUser();
    const stranger = await createUser();
    const order = await createOrder(owner.id, "COMPLETED");
    const d = await adminUploadDeliverable(admin, order.id, "PDF", pdfFile("final.pdf"));
    expect(await deliverableDownloadUrl(owner, d.id)).toBeNull();
    expect(await deliverableDownloadUrl(admin, d.id)).not.toBeNull();
    await adminChangeOrderStatus(admin, order.id, "DELIVERED");
    expect(await deliverableDownloadUrl(owner, d.id)).not.toBeNull();
    expect(await deliverableDownloadUrl(stranger, d.id)).toBeNull();
  });
});

describe("upload validation", () => {
  it("identifies files by content, not by extension", () => {
    expect(sniffResume(pdfFile().bytes)).toBe("pdf");
    expect(sniffResume(docxBytes())).toBe("docx");
    expect(sniffResume(new TextEncoder().encode("MZ\x90\x00 fake exe"))).toBeNull();
    expect(sniffResume(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]))).toBeNull(); // zip but not docx
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
  });

  it("rejects renamed executables, empty and oversized files", async () => {
    const fakePdf = new File([new TextEncoder().encode("MZ executable")], "resume.pdf", { type: "application/pdf" });
    await expect(validateResumeUpload(fakePdf)).rejects.toThrow(/PDF or Word/);
    await expect(validateResumeUpload(new File([], "empty.pdf"))).rejects.toThrow(/choose your resume/);
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "big.pdf");
    await expect(validateResumeUpload(big)).rejects.toThrow(/too large/);
  });

  it("sanitizes file names and forces the sniffed extension", () => {
    expect(safeFileName("../../etc/passwd.exe", "pdf")).toBe("passwd.pdf");
    expect(safeFileName("My CV (final).docx", "docx")).toBe("My-CV-final.docx");
  });
});
