import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/server/services/payments";

/**
 * Paystack webhook. The raw body is verified with HMAC-SHA512 before anything is parsed.
 * Processing is idempotent, so Paystack retries are safe.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  try {
    const { httpStatus } = await handlePaystackWebhook(raw, request.headers.get("x-paystack-signature"));
    return new NextResponse(null, { status: httpStatus });
  } catch (err) {
    console.error("[paystack:webhook] processing error", err);
    // 500 → Paystack retries later; confirmPayment is idempotent.
    return new NextResponse(null, { status: 500 });
  }
}
