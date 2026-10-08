import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { UserError } from "@/server/errors";

const PAYSTACK_API = "https://api.paystack.co";

/** Subset of Paystack's transaction object we rely on. Amounts are in kobo. */
export type PaystackTransaction = {
  id: number;
  status: string; // "success" | "failed" | "abandoned" | "reversed" | ...
  reference: string;
  amount: number;
  currency: string;
  channel?: string | null;
  gateway_response?: string | null;
  paid_at?: string | null;
  metadata?: unknown;
};

export function isPaystackConfigured(): boolean {
  return !!env.paystackSecretKey;
}

function secretKey(): string {
  const key = env.paystackSecretKey;
  if (!key) throw new UserError("Online payments are not available yet. Please try again later or contact support.");
  return key;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || body.data === undefined) {
    throw new Error(`Paystack ${path} failed (${res.status}): ${body?.message ?? "no body"}`);
  }
  return body.data;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; accessCode: string }> {
  const data = await call<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    },
  );
  return { authorizationUrl: data.authorization_url, accessCode: data.access_code };
}

export async function verifyTransaction(reference: string): Promise<PaystackTransaction> {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs webhook bodies with HMAC-SHA512 using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const key = env.paystackSecretKey;
  if (!key || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", key).update(rawBody).digest("hex"), "hex");
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return expected.length === given.length && timingSafeEqual(expected, given);
}
