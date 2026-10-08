import { randomBytes } from "node:crypto";
import { Prisma, type DeliverableType, type ExperienceLevel, type OrderStatus, type Role } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { UserError } from "@/server/errors";
import { audit } from "@/server/audit";
import { notify } from "@/server/notifications";
import { sendEmail } from "@/server/email/send";
import { emails } from "@/server/email/templates";
import { buildObjectKey, createSignedDownloadUrl, putObject } from "@/server/storage";
import { sniffResume, type ValidatedFile } from "@/server/uploads";
import { getResumePriceKobo } from "@/server/services/settings";
import { canTransition } from "@/server/services/order-status";

type Actor = { id: string; role: Role };

const ORDER_EMAIL: Partial<Record<OrderStatus, keyof typeof emails>> = {
  PROCESSING: "orderProcessing",
  COMPLETED: "orderCompleted",
  DELIVERED: "orderDelivered",
};

function orderUrl(orderId: string) {
  return `${env.siteUrl}/dashboard/orders/${orderId}`;
}

function newOrderNumber(): string {
  const year = new Date().getUTCFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `RO-${year}-${suffix}`;
}

// ── Resumes ──────────────────────────────────────────────────────────────────

export async function saveResumeUpload(userId: string, file: ValidatedFile) {
  const key = buildObjectKey(`resumes/${userId}`, file.fileName);
  await putObject("private", key, file.bytes, file.mimeType);
  return db.resume.create({
    data: { userId, fileKey: key, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.size },
  });
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type CreateOrderInput = {
  targetRole: string;
  targetIndustry?: string;
  experienceLevel?: ExperienceLevel;
  customerNotes?: string;
  acceptTerms: boolean;
};

/**
 * Create a PENDING_PAYMENT order. Exactly one of `resumeId` (existing, owned) or `file` is used.
 * Price is read server-side and snapshotted onto the order.
 */
export async function createResumeOrder(
  userId: string,
  input: CreateOrderInput,
  source: { resumeId?: string; file?: ValidatedFile },
) {
  if (!input.acceptTerms) throw new UserError("Please accept the service terms to continue.");

  let resumeId: string;
  if (source.file) {
    resumeId = (await saveResumeUpload(userId, source.file)).id;
  } else if (source.resumeId) {
    const owned = await db.resume.findFirst({ where: { id: source.resumeId, userId }, select: { id: true } });
    if (!owned) throw new UserError("Please choose one of your uploaded resumes or upload a new file.");
    resumeId = owned.id;
  } else {
    throw new UserError("Please upload your current resume.");
  }

  const amountKobo = await getResumePriceKobo();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const order = await db.$transaction(async (trx) => {
        const created = await trx.resumeOrder.create({
          data: {
            orderNumber: newOrderNumber(),
            userId,
            resumeId,
            targetRole: input.targetRole,
            targetIndustry: input.targetIndustry,
            experienceLevel: input.experienceLevel,
            customerNotes: input.customerNotes,
            termsAcceptedAt: new Date(),
            amountKobo,
            currency: "NGN",
            status: "PENDING_PAYMENT",
          },
        });
        await trx.orderStatusHistory.create({
          data: { orderId: created.id, fromStatus: null, toStatus: "PENDING_PAYMENT", note: "Order created" },
        });
        await notify(
          userId,
          {
            type: "ORDER_UPDATE",
            title: "Order created",
            body: `Order ${created.orderNumber} is awaiting payment.`,
            link: `/dashboard/orders/${created.id}`,
          },
          trx,
        );
        return created;
      });
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        await sendEmail(
          user.email,
          emails.orderReceived({ orderNumber: order.orderNumber, targetRole: order.targetRole, url: orderUrl(order.id) }),
        );
      }
      return order;
    } catch (err) {
      const collision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        JSON.stringify(err.meta ?? {}).includes("orderNumber");
      if (!collision) throw err;
    }
  }
  throw new Error("Could not allocate an order number");
}

export async function cancelPendingOrder(userId: string, orderId: string) {
  const res = await db.resumeOrder.updateMany({
    where: { id: orderId, userId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
  if (res.count === 0) throw new UserError("Only unpaid orders can be cancelled.");
  await db.orderStatusHistory.create({
    data: { orderId, fromStatus: "PENDING_PAYMENT", toStatus: "CANCELLED", changedById: userId, note: "Cancelled by customer" },
  });
}

export async function adminChangeOrderStatus(admin: Actor, orderId: string, to: OrderStatus, note?: string) {
  assertAdmin(admin);
  const order = await db.resumeOrder.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true } }, _count: { select: { deliverables: true } } },
  });
  if (!order) throw new UserError("Order not found.");
  if (!canTransition(order.status, to)) {
    throw new UserError(`An order cannot move from ${ORDER_STATUS_LABEL[order.status]} to ${ORDER_STATUS_LABEL[to]}.`);
  }
  if (to === "DELIVERED" && order._count.deliverables === 0) {
    throw new UserError("Upload the final resume file before marking the order as delivered.");
  }

  await db.$transaction(async (trx) => {
    // Optimistic concurrency: fails if another admin changed the status meanwhile.
    const res = await trx.resumeOrder.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        ...(to === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(order.assignedToId ? {} : { assignedToId: admin.id }),
      },
    });
    if (res.count === 0) throw new UserError("This order was updated by someone else. Refresh and try again.");
    await trx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: to, changedById: admin.id, note },
    });
    await notify(
      order.userId,
      {
        type: "ORDER_UPDATE",
        title: `Order ${ORDER_STATUS_LABEL[to]}`,
        body:
          to === "DELIVERED"
            ? `Your optimized resume for order ${order.orderNumber} is ready to download.`
            : `Order ${order.orderNumber} is now ${ORDER_STATUS_LABEL[to]}.`,
        link: `/dashboard/orders/${orderId}`,
      },
      trx,
    );
    await audit(admin.id, "order.status", "ResumeOrder", orderId, { from: order.status, to, note: note ?? null }, trx);
  });

  const info = { orderNumber: order.orderNumber, targetRole: order.targetRole, url: orderUrl(orderId) };
  const template = ORDER_EMAIL[to];
  const message =
    template === "orderProcessing" || template === "orderCompleted" || template === "orderDelivered"
      ? emails[template](info)
      : emails.orderStatus({ ...info, statusLabel: ORDER_STATUS_LABEL[to] });
  await sendEmail(order.user.email, message);
}

export async function adminUpdateOrderNotes(
  admin: Actor,
  orderId: string,
  data: { internalNotes?: string; profileRecommendations?: string },
) {
  assertAdmin(admin);
  await db.resumeOrder.update({
    where: { id: orderId },
    data: { internalNotes: data.internalNotes ?? null, profileRecommendations: data.profileRecommendations ?? null },
  });
  await audit(admin.id, "order.notes", "ResumeOrder", orderId);
}

const DELIVERABLE_ALLOWED: OrderStatus[] = ["RECEIVED", "IN_REVIEW", "PROCESSING", "COMPLETED", "DELIVERED"];

export async function adminUploadDeliverable(admin: Actor, orderId: string, type: DeliverableType, file: ValidatedFile) {
  assertAdmin(admin);
  const expected = type === "PDF" ? "pdf" : "docx";
  if (sniffResume(file.bytes) !== expected) {
    throw new UserError(`That file is not a valid ${type === "PDF" ? "PDF" : "Word (.docx)"} document.`);
  }
  const order = await db.resumeOrder.findUnique({ where: { id: orderId }, select: { status: true, userId: true } });
  if (!order) throw new UserError("Order not found.");
  if (!DELIVERABLE_ALLOWED.includes(order.status)) {
    throw new UserError("Final files can only be uploaded for paid orders that are being processed.");
  }
  const key = buildObjectKey(`deliverables/${orderId}`, file.fileName);
  await putObject("private", key, file.bytes, file.mimeType);
  const version = (await db.orderDeliverable.count({ where: { orderId, type } })) + 1;
  const deliverable = await db.orderDeliverable.create({
    data: { orderId, type, fileKey: key, fileName: file.fileName, version, uploadedById: admin.id },
  });
  await audit(admin.id, "order.deliverable_upload", "ResumeOrder", orderId, { type, version });
  return deliverable;
}

// ── File access (ownership enforced) ─────────────────────────────────────────

export async function resumeDownloadUrl(actor: Actor, resumeId: string): Promise<string | null> {
  const resume = await db.resume.findUnique({ where: { id: resumeId } });
  if (!resume) return null;
  if (resume.userId !== actor.id && actor.role !== "ADMIN") return null;
  if (actor.role === "ADMIN" && resume.userId !== actor.id) {
    await audit(actor.id, "file.resume_download", "Resume", resume.id);
  }
  return createSignedDownloadUrl(resume.fileKey, resume.fileName);
}

export async function deliverableDownloadUrl(actor: Actor, deliverableId: string): Promise<string | null> {
  const d = await db.orderDeliverable.findUnique({
    where: { id: deliverableId },
    include: { order: { select: { userId: true, status: true } } },
  });
  if (!d) return null;
  const isOwner = d.order.userId === actor.id;
  if (actor.role !== "ADMIN") {
    // Customers only see final files once the order is delivered.
    if (!isOwner || d.order.status !== "DELIVERED") return null;
  }
  return createSignedDownloadUrl(d.fileKey, d.fileName);
}

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
}
