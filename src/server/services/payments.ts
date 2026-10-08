import { randomBytes } from "node:crypto";
import { Prisma, type PaymentEventSource } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { UserError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { notify } from "@/server/notifications";
import { sendEmail } from "@/server/email/send";
import { emails } from "@/server/email/templates";
import { track } from "@/server/analytics";
import {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  type PaystackTransaction,
} from "@/server/paystack";

export type ConfirmResult =
  | { status: "confirmed"; orderId: string }
  | { status: "already_confirmed"; orderId: string }
  | { status: "not_successful"; orderId: string; gatewayStatus: string }
  | { status: "mismatch"; orderId: string; reason: string }
  | { status: "unknown_reference" };

async function logEvent(
  reference: string,
  source: PaymentEventSource,
  event: string,
  payload?: unknown,
  paymentId?: string | null,
) {
  await db.paymentEvent.create({
    data: {
      reference,
      source,
      event,
      paymentId: paymentId ?? null,
      payload: payload === undefined ? undefined : (JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue),
    },
  });
}

/**
 * Start Paystack checkout for an order owned by `userId`.
 * The amount always comes from the order's server-side price snapshot.
 */
export async function startCheckout(userId: string, orderId: string): Promise<string> {
  if (!(await rateLimit("paymentInit", `user:${userId}`))) {
    throw new UserError("Too many payment attempts. Please wait a few minutes and try again.");
  }
  const order = await db.resumeOrder.findFirst({
    where: { id: orderId, userId },
    include: { user: { select: { email: true } } },
  });
  if (!order) throw new UserError("Order not found.");
  if (order.status !== "PENDING_PAYMENT") throw new UserError("This order has already been paid or is closed.");

  const reference = `RO-${order.orderNumber}-${randomBytes(4).toString("hex")}`.toUpperCase();
  const payment = await db.payment.create({
    data: { userId, orderId: order.id, reference, amountKobo: order.amountKobo, currency: order.currency, status: "PENDING" },
  });

  try {
    const { authorizationUrl, accessCode } = await initializeTransaction({
      email: order.user.email,
      amountKobo: order.amountKobo,
      reference,
      callbackUrl: `${env.siteUrl}/api/paystack/callback`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId },
    });
    await logEvent(reference, "INITIALIZE", "initialize.success", { accessCode }, payment.id);
    await track("resume_checkout_started", { userId, props: { orderId: order.id } });
    return authorizationUrl;
  } catch (err) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", gatewayResponse: "initialize_failed" } });
    await logEvent(reference, "INITIALIZE", "initialize.error", { message: String(err) }, payment.id);
    if (err instanceof UserError) throw err;
    console.error("[payments] initialize failed", err);
    throw new UserError("We couldn't start the payment. Please try again in a moment.");
  }
}

/**
 * The single, idempotent path that can mark an order as PAID.
 * `tx` must come from a trusted source: Paystack's verify API or a signature-checked webhook.
 */
export async function confirmPayment(
  reference: string,
  tx: PaystackTransaction,
  source: PaymentEventSource,
): Promise<ConfirmResult> {
  const payment = await db.payment.findUnique({ where: { reference }, include: { order: true } });
  if (!payment) {
    await logEvent(reference, source, "unknown_reference", tx);
    return { status: "unknown_reference" };
  }
  const orderId = payment.orderId;

  if (payment.status === "SUCCESS") {
    await logEvent(reference, source, "duplicate_ignored", { id: tx.id }, payment.id);
    return { status: "already_confirmed", orderId };
  }

  if (tx.status !== "success") {
    const failedStatus = tx.status === "abandoned" ? "ABANDONED" : "FAILED";
    await db.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: failedStatus, gatewayResponse: tx.gateway_response ?? tx.status, rawVerification: toJson(tx) },
    });
    await logEvent(reference, source, `not_successful.${tx.status}`, tx, payment.id);
    return { status: "not_successful", orderId, gatewayStatus: tx.status };
  }

  const reason =
    tx.reference !== payment.reference
      ? "reference mismatch"
      : tx.currency !== "NGN" || payment.currency !== "NGN"
        ? `currency ${tx.currency} is not NGN`
        : tx.amount !== payment.amountKobo || payment.amountKobo !== payment.order.amountKobo
          ? `amount ${tx.amount} does not match expected ${payment.order.amountKobo}`
          : null;

  if (reason) {
    await db.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED", gatewayResponse: `verification_failed: ${reason}`, rawVerification: toJson(tx) },
    });
    await logEvent(reference, source, "verification_failed", { reason, tx }, payment.id);
    if (env.adminAlertEmail) await sendEmail(env.adminAlertEmail, emails.paymentMismatchAlert(reference, reason));
    return { status: "mismatch", orderId, reason };
  }

  const paidAt = tx.paid_at ? new Date(tx.paid_at) : new Date();
  let outcome: "none" | "payment_only" | "paid" = "none";
  try {
    outcome = await db.$transaction(async (trx) => {
      // Conditional update = idempotency guard. Concurrent webhook + callback: only one wins.
      const updated = await trx.payment.updateMany({
        where: { id: payment.id, status: { not: "SUCCESS" } },
        data: {
          status: "SUCCESS",
          paystackId: String(tx.id),
          channel: tx.channel ?? null,
          gatewayResponse: tx.gateway_response ?? "success",
          paidAt,
          verifiedAt: new Date(),
          rawVerification: toJson(tx),
        },
      });
      if (updated.count === 0) return "none" as const;

      const order = await trx.resumeOrder.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID", paidAt },
      });
      if (order.count === 1) {
        await trx.orderStatusHistory.create({
          data: { orderId, fromStatus: "PENDING_PAYMENT", toStatus: "PAID", note: `Payment ${reference} verified via ${source.toLowerCase()}` },
        });
        await notify(
          payment.userId,
          {
            type: "PAYMENT",
            title: "Payment confirmed",
            body: `We received your payment for order ${payment.order.orderNumber}. Our team will start on your resume shortly.`,
            link: `/dashboard/orders/${orderId}`,
          },
          trx,
        );
        return "paid" as const;
      }
      return "payment_only" as const;
    });
  } catch (err) {
    // Unique violation on paystackId: this Paystack transaction was already used for another payment.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      await logEvent(reference, source, "duplicate_transaction_id", { id: tx.id }, payment.id);
      return { status: "mismatch", orderId, reason: "transaction already applied to another payment" };
    }
    throw err;
  }

  if (outcome === "none") {
    await logEvent(reference, source, "duplicate_ignored", { id: tx.id }, payment.id);
    return { status: "already_confirmed", orderId };
  }
  if (outcome === "payment_only") {
    // Money received for an order that was no longer awaiting payment (e.g. cancelled, or paid
    // through a second checkout). Record it and alert an admin to refund — never double-process.
    await logEvent(reference, source, "paid_but_order_not_pending", { id: tx.id, orderStatus: payment.order.status }, payment.id);
    if (env.adminAlertEmail) {
      await sendEmail(env.adminAlertEmail, emails.paymentMismatchAlert(reference, "payment succeeded but the order was not awaiting payment — review for refund"));
    }
    return { status: "already_confirmed", orderId };
  }

  await logEvent(reference, source, "confirmed", { id: tx.id, amount: tx.amount }, payment.id);
  await track("resume_payment_successful", { userId: payment.userId, props: { orderId } });
  const user = await db.user.findUnique({ where: { id: payment.userId }, select: { email: true } });
  if (user) {
    await sendEmail(
      user.email,
      emails.paymentConfirmed({
        orderNumber: payment.order.orderNumber,
        targetRole: payment.order.targetRole,
        url: `${env.siteUrl}/dashboard/orders/${orderId}`,
        amountKobo: payment.amountKobo,
        reference,
      }),
    );
  }
  return { status: "confirmed", orderId };
}

/** Callback path: ask Paystack directly, never trust query-string status. */
export async function verifyAndConfirm(reference: string): Promise<ConfirmResult> {
  const payment = await db.payment.findUnique({ where: { reference }, select: { id: true, status: true, orderId: true } });
  if (!payment) return { status: "unknown_reference" };
  if (payment.status === "SUCCESS") return { status: "already_confirmed", orderId: payment.orderId };
  const tx = await verifyTransaction(reference);
  await logEvent(reference, "VERIFY", `verify.${tx.status}`, { id: tx.id, amount: tx.amount, currency: tx.currency }, payment.id);
  return confirmPayment(reference, tx, "VERIFY");
}

export type WebhookResult = { httpStatus: number; result?: ConfirmResult | "ignored" };

export async function handlePaystackWebhook(rawBody: string, signature: string | null): Promise<WebhookResult> {
  if (!verifyWebhookSignature(rawBody, signature)) return { httpStatus: 401 };
  let payload: { event?: string; data?: PaystackTransaction };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { httpStatus: 400 };
  }
  const reference = payload.data?.reference;
  if (!reference || !payload.event) return { httpStatus: 200, result: "ignored" };

  if (payload.event === "charge.success") {
    const result = await confirmPayment(reference, payload.data!, "WEBHOOK");
    return { httpStatus: 200, result };
  }
  await logEvent(reference, "WEBHOOK", payload.event, payload.data);
  return { httpStatus: 200, result: "ignored" };
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
