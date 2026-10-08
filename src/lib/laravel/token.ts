"use client";

import { PENDING_PAYMENT_STORAGE_KEY, TOKEN_STORAGE_KEY } from "@/lib/laravel/config";

/**
 * Client-side storage for the Laravel Sanctum bearer token.
 * The Laravel API is bearer-token only (supports_credentials=false), so the token is kept
 * in the browser and sent as `Authorization: Bearer`; no cookies are involved.
 */
const TOKEN_EVENT = "careerprep:token";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
}

export function setToken(token: string) {
  storage()?.setItem(TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new Event(TOKEN_EVENT));
}

export function clearToken() {
  storage()?.removeItem(TOKEN_STORAGE_KEY);
  storage()?.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TOKEN_EVENT));
}

/** Subscribe to sign-in/sign-out in this tab and in other tabs. */
export function onTokenChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOKEN_STORAGE_KEY) cb();
  };
  window.addEventListener(TOKEN_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(TOKEN_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

// ── Pending payment (survives the Paystack redirect) ─────────────────────────

export type PendingPayment = { paymentId: number; resumeId: number };

export function savePendingPayment(p: PendingPayment) {
  storage()?.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(p));
}

export function getPendingPayment(): PendingPayment | null {
  const raw = storage()?.getItem(PENDING_PAYMENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<PendingPayment>;
    return typeof v.paymentId === "number" && typeof v.resumeId === "number" ? { paymentId: v.paymentId, resumeId: v.resumeId } : null;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  storage()?.removeItem(PENDING_PAYMENT_STORAGE_KEY);
}
