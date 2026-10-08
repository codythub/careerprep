import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAndConfirm } from "@/server/services/payments";

/**
 * Paystack redirects the customer here after checkout. We never trust the query
 * string — the reference is verified server-to-server with Paystack.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = (url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "").slice(0, 100);
  if (!reference) return NextResponse.redirect(new URL("/dashboard/orders", request.url), 303);

  const payment = await db.payment.findUnique({ where: { reference }, select: { orderId: true } });
  if (!payment) return NextResponse.redirect(new URL("/dashboard/orders", request.url), 303);

  let status = "pending";
  try {
    const result = await verifyAndConfirm(reference);
    status =
      result.status === "confirmed" || result.status === "already_confirmed"
        ? "success"
        : result.status === "not_successful"
          ? "failed"
          : result.status === "mismatch"
            ? "error"
            : "pending";
  } catch (err) {
    // Network issue talking to Paystack: the webhook will still confirm the payment.
    console.error("[paystack:callback] verify failed", err);
  }
  return NextResponse.redirect(new URL(`/dashboard/orders/${payment.orderId}?payment=${status}`, request.url), 303);
}
