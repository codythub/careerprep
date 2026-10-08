import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { confirmPayment, handlePaystackWebhook, startCheckout, verifyAndConfirm } from "@/server/services/payments";
import { createOrder, createPayment, createUser, paystackTx, signWebhook } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

async function setup(amountKobo = 600000) {
  const user = await createUser();
  const order = await createOrder(user.id, "PENDING_PAYMENT", amountKobo);
  const payment = await createPayment(user.id, order.id, amountKobo);
  return { user, order, payment };
}

describe("confirmPayment", () => {
  it("marks payment SUCCESS and order PAID when amount, currency and reference match", async () => {
    const { order, payment } = await setup();
    const res = await confirmPayment(payment.reference, paystackTx(payment.reference), "VERIFY");
    expect(res.status).toBe("confirmed");
    const o = await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.status).toBe("PAID");
    expect(o.paidAt).not.toBeNull();
    const p = await db.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(p.status).toBe("SUCCESS");
    expect(await db.orderStatusHistory.count({ where: { orderId: order.id, toStatus: "PAID" } })).toBe(1);
    expect(await db.notification.count({ where: { type: "PAYMENT" } })).toBe(1);
  });

  it("rejects an incorrect amount and leaves the order unpaid", async () => {
    const { order, payment } = await setup();
    const res = await confirmPayment(payment.reference, paystackTx(payment.reference, { amount: 100 }), "WEBHOOK");
    expect(res.status).toBe("mismatch");
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("FAILED");
  });

  it("rejects an incorrect currency", async () => {
    const { order, payment } = await setup();
    const res = await confirmPayment(payment.reference, paystackTx(payment.reference, { currency: "USD" }), "WEBHOOK");
    expect(res.status).toBe("mismatch");
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("rejects a transaction whose reference doesn't match", async () => {
    const { order, payment } = await setup();
    const res = await confirmPayment(payment.reference, paystackTx("SOMEONE-ELSES-REF"), "WEBHOOK");
    expect(res.status).toBe("mismatch");
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("records failed payments without paying the order", async () => {
    const { order, payment } = await setup();
    const res = await confirmPayment(payment.reference, paystackTx(payment.reference, { status: "failed" }), "VERIFY");
    expect(res.status).toBe("not_successful");
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("FAILED");
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("returns unknown_reference for references we never issued", async () => {
    const res = await confirmPayment("NOPE", paystackTx("NOPE"), "WEBHOOK");
    expect(res.status).toBe("unknown_reference");
  });

  it("is idempotent under concurrent confirmation (webhook + callback race)", async () => {
    const { order, payment } = await setup();
    const tx = paystackTx(payment.reference);
    const results = await Promise.all([
      confirmPayment(payment.reference, tx, "WEBHOOK"),
      confirmPayment(payment.reference, tx, "VERIFY"),
      confirmPayment(payment.reference, tx, "WEBHOOK"),
    ]);
    expect(results.filter((r) => r.status === "confirmed")).toHaveLength(1);
    expect(await db.orderStatusHistory.count({ where: { orderId: order.id, toStatus: "PAID" } })).toBe(1);
    expect(await db.notification.count({ where: { type: "PAYMENT" } })).toBe(1);
  });

  it("logs every payment event", async () => {
    const { payment } = await setup();
    await confirmPayment(payment.reference, paystackTx(payment.reference), "WEBHOOK");
    await confirmPayment(payment.reference, paystackTx(payment.reference), "WEBHOOK");
    const events = await db.paymentEvent.findMany({ where: { reference: payment.reference }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => e.event)).toEqual(["confirmed", "duplicate_ignored"]);
  });
});

describe("Paystack webhook", () => {
  it("rejects requests without a valid signature", async () => {
    const { payment } = await setup();
    const body = JSON.stringify({ event: "charge.success", data: paystackTx(payment.reference) });
    expect((await handlePaystackWebhook(body, null)).httpStatus).toBe(401);
    expect((await handlePaystackWebhook(body, signWebhook(body, "wrong-secret"))).httpStatus).toBe(401);
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("PENDING");
  });

  it("processes a signed charge.success once, even when delivered repeatedly", async () => {
    const { order, payment } = await setup();
    const body = JSON.stringify({ event: "charge.success", data: paystackTx(payment.reference) });
    const sig = signWebhook(body);
    const first = await handlePaystackWebhook(body, sig);
    const second = await handlePaystackWebhook(body, sig);
    expect(first).toMatchObject({ httpStatus: 200, result: { status: "confirmed" } });
    expect(second).toMatchObject({ httpStatus: 200, result: { status: "already_confirmed" } });
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
    expect(await db.payment.count({ where: { orderId: order.id, status: "SUCCESS" } })).toBe(1);
  });

  it("ignores unrelated events", async () => {
    const body = JSON.stringify({ event: "transfer.success", data: { reference: "X" } });
    expect(await handlePaystackWebhook(body, signWebhook(body))).toMatchObject({ httpStatus: 200, result: "ignored" });
  });
});

describe("server-side verification and checkout", () => {
  it("verifyAndConfirm trusts Paystack's verify API, not the client", async () => {
    const { order, payment } = await setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: true, data: paystackTx(payment.reference) }), { status: 200 }),
    );
    const res = await verifyAndConfirm(payment.reference);
    expect(res.status).toBe("confirmed");
    expect(String(fetchMock.mock.calls[0]![0])).toContain(`/transaction/verify/${payment.reference}`);
    expect((await db.resumeOrder.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
  });

  it("startCheckout charges the order's stored price, not any client value", async () => {
    const user = await createUser();
    const order = await createOrder(user.id, "PENDING_PAYMENT", 600000);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.com/abc", access_code: "abc", reference: "x" } }), { status: 200 }),
    );
    const url = await startCheckout(user.id, order.id);
    expect(url).toBe("https://checkout.paystack.com/abc");
    const sent = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body));
    expect(sent.amount).toBe(600000);
    expect(sent.currency).toBe("NGN");
    const payment = await db.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.reference).toBe(sent.reference);
    expect(payment.amountKobo).toBe(600000);
  });

  it("startCheckout refuses orders the user doesn't own or that are already paid", async () => {
    const owner = await createUser();
    const other = await createUser();
    const order = await createOrder(owner.id);
    await expect(startCheckout(other.id, order.id)).rejects.toThrow(/Order not found/);
    const paid = await createOrder(owner.id, "PAID");
    await expect(startCheckout(owner.id, paid.id)).rejects.toThrow(/already been paid/);
  });
});
