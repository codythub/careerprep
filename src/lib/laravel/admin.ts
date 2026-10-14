/**
 * Admin API client (/api/v1/admin) — shapes follow the Laravel contract in docs/FRONTEND_API.md
 * ("Admin API"). Every route is admin-only on the server; this client never decides access.
 * Normalisers only rename fields Laravel sent; missing values stay null.
 */
import { ADMIN_ENDPOINTS } from "@/lib/laravel/config";
import { ApiError, laravel } from "@/lib/laravel/client";
import { fetchFile } from "@/lib/laravel/api";
import {
  isObj,
  num,
  oneOf,
  str,
  toPage,
  toReview,
  unwrap,
  type EntitlementStatus,
  type ExtractionStatus,
  type Obj,
  type Page,
  type PaymentStatus,
  type Review,
} from "@/lib/laravel/types";

export type UserSummary = { id: string; name: string | null; email: string | null };
export type Role = "candidate" | "admin";

export type AdminUser = UserSummary & {
  role: Role;
  phone: string | null;
  location: string | null;
  professionalTitle: string | null;
  resumesCount: number | null;
  paymentsCount: number | null;
  reviewsCount: number | null;
  createdAt: string | null;
};

export type AdminResume = {
  id: string;
  userId: string | null;
  user: UserSummary | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  extractionStatus: ExtractionStatus | null;
  extractionError: string | null;
  createdAt: string | null;
};

export type AdminPayment = {
  id: string;
  userId: string | null;
  user: UserSummary | null;
  resumeId: string | null;
  reference: string | null;
  amount: number | null;
  currency: string | null;
  status: PaymentStatus;
  entitlementStatus: EntitlementStatus;
  reviewId: string | null;
  providerTransactionId: string | null;
  verifiedAt: string | null;
  refundedAt: string | null;
  refundNote: string | null;
  createdAt: string | null;
};

export type AdminReview = Review & {
  userId: string | null;
  user: UserSummary | null;
  extraAttempts: number | null;
  paymentStatus: PaymentStatus;
};

export type AuditAction = "resume.download" | "payment.reverify" | "payment.mark_refunded" | "review.retry" | "review.grant_attempt";
export const AUDIT_ACTIONS: AuditAction[] = ["resume.download", "payment.reverify", "payment.mark_refunded", "review.retry", "review.grant_attempt"];

export type AuditEntry = {
  id: string;
  actor: UserSummary | null;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  before: Obj | null;
  after: Obj | null;
  ipAddress: string | null;
  createdAt: string | null;
};

export type MoneyTotal = { currency: string; amount: number; payments: number | null };
export type AdminStats = {
  period: { from: string | null; to: string | null };
  users: { total: number; candidate: number; admin: number };
  resumes: { total: number; pending: number; succeeded: number; failed: number };
  payments: { total: number; pending: number; initialized: number; verified: number; failed: number; refunded: number };
  reviews: { total: number; pending: number; completed: number; failed: number; retryableFailed: number };
  revenue: MoneyTotal[];
  refunds: MoneyTotal[];
};

export type AdminUserDetail = AdminUser & { latestResumes: AdminResume[]; latestPayments: AdminPayment[]; latestReviews: AdminReview[] };

// ── Normalisers ─────────────────────────────────────────────────────────────

const PAYMENT_STATUSES = ["pending", "initialized", "verified", "failed", "refunded"] as const;
const ENTITLEMENTS = ["available", "consumed", "unavailable"] as const;
const EXTRACTION = ["pending", "succeeded", "failed"] as const;

function toUserSummary(v: unknown): UserSummary | null {
  if (!isObj(v)) return null;
  const id = str(v.id);
  return id ? { id, name: str(v.name), email: str(v.email) } : null;
}

export function toAdminUser(raw: unknown): AdminUser | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const base = toUserSummary(o);
  if (!base) return null;
  return {
    ...base,
    role: o.role === "admin" ? "admin" : "candidate",
    phone: str(o.phone),
    location: str(o.location),
    professionalTitle: str(o.professional_title),
    resumesCount: num(o.resumes_count),
    paymentsCount: num(o.payments_count),
    reviewsCount: num(o.reviews_count),
    createdAt: str(o.created_at),
  };
}

export function toAdminResume(raw: unknown): AdminResume | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  const ex = oneOf(o.extraction_status, EXTRACTION);
  return {
    id,
    userId: str(o.user_id),
    user: toUserSummary(o.user),
    fileName: str(o.original_name) ?? `Resume ${id}`,
    mimeType: str(o.mime_type),
    sizeBytes: num(o.size),
    extractionStatus: ex === "unknown" ? null : ex,
    extractionError: str(o.extraction_error),
    createdAt: str(o.created_at),
  };
}

export function toAdminPayment(raw: unknown): AdminPayment | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    userId: str(o.user_id),
    user: toUserSummary(o.user),
    resumeId: str(o.resume_id),
    reference: str(o.reference),
    amount: num(o.amount),
    currency: str(o.currency),
    status: oneOf(o.status, PAYMENT_STATUSES),
    entitlementStatus: oneOf(o.entitlement_status, ENTITLEMENTS),
    reviewId: str(o.review_id),
    providerTransactionId: str(o.provider_transaction_id),
    verifiedAt: str(o.verified_at),
    refundedAt: str(o.refunded_at),
    refundNote: str(o.refund_note),
    createdAt: str(o.created_at),
  };
}

export function toAdminReview(raw: unknown): AdminReview | null {
  const review = toReview(raw);
  const o = unwrap(raw);
  if (!review || !isObj(o)) return null;
  return {
    ...review,
    userId: str(o.user_id),
    user: toUserSummary(o.user),
    extraAttempts: num(o.extra_attempts),
    paymentStatus: oneOf(o.payment_status, PAYMENT_STATUSES),
  };
}

export function toAuditEntry(raw: unknown): AuditEntry | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    actor: toUserSummary(o.actor),
    actorId: str(o.actor_id),
    action: str(o.action) ?? "unknown",
    targetType: str(o.target_type),
    targetId: str(o.target_id),
    before: isObj(o.before) ? o.before : null,
    after: isObj(o.after) ? o.after : null,
    ipAddress: str(o.ip_address),
    createdAt: str(o.created_at),
  };
}

const n0 = (v: unknown) => num(v) ?? 0;
function toMoney(v: unknown): MoneyTotal[] {
  return (Array.isArray(v) ? v : []).flatMap((m): MoneyTotal[] => {
    if (!isObj(m)) return [];
    const currency = str(m.currency);
    const amount = num(m.amount);
    return currency && amount !== null ? [{ currency, amount, payments: num(m.payments) }] : [];
  });
}

export function toAdminStats(raw: unknown): AdminStats | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const g = (k: string) => (isObj(o[k]) ? (o[k] as Obj) : {});
  const period = g("period");
  const u = g("users"), r = g("resumes"), p = g("payments"), v = g("reviews");
  return {
    period: { from: str(period.from), to: str(period.to) },
    users: { total: n0(u.total), candidate: n0(u.candidate), admin: n0(u.admin) },
    resumes: { total: n0(r.total), pending: n0(r.pending), succeeded: n0(r.succeeded), failed: n0(r.failed) },
    payments: { total: n0(p.total), pending: n0(p.pending), initialized: n0(p.initialized), verified: n0(p.verified), failed: n0(p.failed), refunded: n0(p.refunded) },
    reviews: { total: n0(v.total), pending: n0(v.pending), completed: n0(v.completed), failed: n0(v.failed), retryableFailed: n0(v.retryable_failed) },
    revenue: toMoney(o.revenue),
    refunds: toMoney(o.refunds),
  };
}

function toUserDetail(raw: unknown): AdminUserDetail | null {
  const o = unwrap(raw);
  const user = toAdminUser(raw);
  if (!user || !isObj(o)) return null;
  const list = <T,>(v: unknown, map: (x: unknown) => T | null) => (Array.isArray(v) ? v.map(map).filter((x): x is T => x !== null) : []);
  return {
    ...user,
    latestResumes: list(o.latest_resumes, toAdminResume),
    latestPayments: list(o.latest_payments, toAdminPayment),
    latestReviews: list(o.latest_reviews, toAdminReview),
  };
}

// ── Client ──────────────────────────────────────────────────────────────────

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new ApiError(`The CareerPrep service returned an unexpected ${what} response.`, 502);
  return value;
}

/** Query string from filters, skipping empty values. */
export function query(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && String(v) !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

type Filters = Record<string, string | number | undefined | null>;

export const adminApi = {
  async stats(token: string, f: { from?: string; to?: string } = {}): Promise<AdminStats> {
    return required(toAdminStats(await laravel(`${ADMIN_ENDPOINTS.stats}${query(f)}`, { token })), "stats");
  },
  async users(token: string, f: Filters = {}): Promise<Page<AdminUser>> {
    return toPage(await laravel(`${ADMIN_ENDPOINTS.users}${query(f)}`, { token }), toAdminUser);
  },
  async user(token: string, id: string): Promise<AdminUserDetail> {
    return required(toUserDetail(await laravel(ADMIN_ENDPOINTS.user(id), { token })), "user");
  },
  async resumes(token: string, f: Filters = {}): Promise<Page<AdminResume>> {
    return toPage(await laravel(`${ADMIN_ENDPOINTS.resumes}${query(f)}`, { token }), toAdminResume);
  },
  async resume(token: string, id: string): Promise<AdminResume> {
    return required(toAdminResume(await laravel(ADMIN_ENDPOINTS.resume(id), { token })), "resume");
  },
  /** PDF as a Blob (audited as resume.download by Laravel). */
  async downloadResume(token: string, id: string, fallbackName: string) {
    return fetchFile(token, ADMIN_ENDPOINTS.resumeDownload(id), fallbackName);
  },
  async payments(token: string, f: Filters = {}): Promise<Page<AdminPayment>> {
    return toPage(await laravel(`${ADMIN_ENDPOINTS.payments}${query(f)}`, { token }), toAdminPayment);
  },
  async payment(token: string, id: string): Promise<AdminPayment> {
    return required(toAdminPayment(await laravel(ADMIN_ENDPOINTS.payment(id), { token })), "payment");
  },
  /** Re-check with Paystack. 200 even when Paystack doesn't confirm; meta says what it reported. */
  async reverifyPayment(token: string, id: string): Promise<{ payment: AdminPayment; verified: boolean; providerStatus: string | null }> {
    const body = await laravel(ADMIN_ENDPOINTS.paymentReverify(id), { method: "POST", token });
    const meta = isObj(body) && isObj(body.meta) ? body.meta : {};
    return { payment: required(toAdminPayment(body), "payment"), verified: meta.verified === true, providerStatus: str(meta.provider_status) };
  },
  /** Records a refund already made in the Paystack dashboard. Moves no money. */
  async markRefunded(token: string, id: string, note: string): Promise<AdminPayment> {
    return required(toAdminPayment(await laravel(ADMIN_ENDPOINTS.paymentMarkRefunded(id), { method: "POST", token, json: { note } })), "payment");
  },
  async reviews(token: string, f: Filters = {}): Promise<Page<AdminReview>> {
    return toPage(await laravel(`${ADMIN_ENDPOINTS.reviews}${query(f)}`, { token }), toAdminReview);
  },
  async review(token: string, id: string): Promise<AdminReview> {
    return required(toAdminReview(await laravel(ADMIN_ENDPOINTS.review(id), { token })), "review");
  },
  /** Support override: reprocesses a non-completed review regardless of the candidate's attempt limit. */
  async retryReview(token: string, id: string, resumeId?: string): Promise<AdminReview> {
    const json = resumeId ? { resume_id: Number(resumeId) } : {};
    return required(toAdminReview(await laravel(ADMIN_ENDPOINTS.reviewRetry(id), { method: "POST", token, json })), "review");
  },
  async grantAttempt(token: string, id: string): Promise<AdminReview> {
    return required(toAdminReview(await laravel(ADMIN_ENDPOINTS.reviewGrantAttempt(id), { method: "POST", token })), "review");
  },
  async auditLog(token: string, f: Filters = {}): Promise<Page<AuditEntry>> {
    return toPage(await laravel(`${ADMIN_ENDPOINTS.auditLog}${query(f)}`, { token }), toAuditEntry);
  },
};
