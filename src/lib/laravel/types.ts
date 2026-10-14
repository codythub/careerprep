/**
 * Shapes the frontend renders, plus tolerant normalisers for Laravel responses.
 *
 * Normalisers only RENAME fields Laravel already sent (accepting common Laravel naming
 * variants and the `{ data: ... }` API Resource envelope). They never invent values:
 * anything missing stays null/empty and the UI shows it as unavailable.
 */

export type Obj = Record<string, unknown>;

export const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
export const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : typeof v === "number" ? String(v) : null);
export const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};
const pick = (o: Obj, ...keys: string[]): unknown => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

/** Laravel API Resources wrap payloads in `{ data: ... }`; accept both forms. */
export function unwrap(body: unknown): unknown {
  if (isObj(body) && "data" in body && Object.keys(body).every((k) => ["data", "meta", "links", "message"].includes(k))) {
    return body.data;
  }
  return body;
}

// ── Users / profile ─────────────────────────────────────────────────────────

export type Candidate = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  professionalTitle: string | null;
  /** From GET /auth/user. Only used to show or hide admin UI — Laravel enforces access. */
  role: "candidate" | "admin";
};

export function toCandidate(body: unknown): Candidate | null {
  let o = unwrap(body);
  if (isObj(o) && isObj(o.data)) o = o.data; // auth responses: { data: User, token }
  if (isObj(o) && isObj(o.user)) o = o.user;
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    name: str(o.name),
    email: str(o.email),
    phone: str(o.phone),
    location: str(o.location),
    professionalTitle: str(pick(o, "professional_title", "professionalTitle")),
    role: o.role === "admin" ? "admin" : "candidate",
  };
}

/** Auth responses (register/login) are `{ data: User, token: string, expires_at: string | null }`. */
export function toAuth(body: unknown): { token: string; user: Candidate | null; expiresAt: string | null } | null {
  if (!isObj(body)) return null;
  const token = str(body.token);
  if (!token) return null;
  return { token, user: toCandidate(body.data), expiresAt: str(body.expires_at) };
}

// ── Pricing ─────────────────────────────────────────────────────────────────

/** Price of one review. `amount` is in the smallest unit (kobo); unavailable means checkout is off. */
export type Pricing = { amount: number | null; currency: string | null; available: boolean };

export function toPricing(body: unknown): Pricing | null {
  const o = unwrap(body);
  const review = isObj(o) && isObj(o.review) ? o.review : null;
  if (!review) return null;
  const amount = num(review.amount);
  const currency = str(review.currency);
  // Only offer checkout when Laravel says so AND sent a usable price.
  return { amount, currency, available: review.available === true && amount !== null && amount > 0 };
}

// ── Pagination (Laravel: data, links, meta) ─────────────────────────────────

export type Page<T> = { items: T[]; currentPage: number; lastPage: number; total: number; perPage: number };

export function toPage<T>(body: unknown, map: (raw: unknown) => T | null): Page<T> {
  const o = isObj(body) ? body : {};
  const items = (Array.isArray(o.data) ? o.data : []).map(map).filter((x): x is T => x !== null);
  const meta = isObj(o.meta) ? o.meta : {};
  return {
    items,
    currentPage: num(meta.current_page) ?? 1,
    lastPage: num(meta.last_page) ?? 1,
    total: num(meta.total) ?? items.length,
    perPage: num(meta.per_page) ?? items.length,
  };
}

// ── Resumes ─────────────────────────────────────────────────────────────────

export type ExtractionStatus = "pending" | "succeeded" | "failed";

export type Resume = {
  id: string;
  fileName: string;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
  /** Whether Laravel could read the PDF's text. A review of a `failed` resume will fail too. */
  extractionStatus: ExtractionStatus | null;
  extractionError: string | null;
};

const EXTRACTION_STATUSES = new Set<string>(["pending", "succeeded", "failed"]);

export function toResume(raw: unknown): Resume | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  const extraction = str(o.extraction_status);
  return {
    id,
    fileName: str(pick(o, "original_name", "original_filename", "file_name", "filename", "name")) ?? `Resume ${id}`,
    sizeBytes: num(pick(o, "size", "size_bytes", "file_size")),
    mimeType: str(pick(o, "mime_type", "mime")),
    uploadedAt: str(pick(o, "uploaded_at", "created_at")),
    extractionStatus: extraction && EXTRACTION_STATUSES.has(extraction) ? (extraction as ExtractionStatus) : null,
    extractionError: str(o.extraction_error),
  };
}

// ── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "initialized" | "verified" | "failed" | "refunded" | "unknown";
/** available = verified and unused · consumed = a review was created · unavailable = not verified. */
export type EntitlementStatus = "available" | "consumed" | "unavailable" | "unknown";

export type Payment = {
  id: number;
  resumeId: string | null;
  reference: string | null;
  /** Smallest currency unit (kobo for NGN), as set by Laravel. */
  amount: number | null;
  currency: string | null;
  status: PaymentStatus;
  authorizationUrl: string | null;
  entitlementStatus: EntitlementStatus;
  reviewId: string | null;
  verifiedAt: string | null;
  createdAt: string | null;
};

export const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | "unknown" =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : "unknown";

/** Payment resource: `{ data: Payment }` or a list item. */
export function toPayment(raw: unknown): Payment | null {
  const o = unwrap(raw);
  if (!isObj(o)) return null;
  const id = num(o.id);
  if (id === null) return null;
  const url = str(o.authorization_url);
  return {
    id,
    resumeId: str(o.resume_id),
    reference: str(o.reference),
    amount: num(o.amount),
    currency: str(o.currency),
    status: oneOf(o.status, ["pending", "initialized", "verified", "failed", "refunded"] as const),
    // Only ever navigate to an https Paystack checkout URL.
    authorizationUrl: url && /^https:\/\//.test(url) ? url : null,
    entitlementStatus: oneOf(o.entitlement_status, ["available", "consumed", "unavailable"] as const),
    reviewId: str(o.review_id),
    verifiedAt: str(o.verified_at),
    createdAt: str(o.created_at),
  };
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export type CategoryScore = { name: string; score: number; max: number | null };
export type Finding = { title: string; detail: string | null; category: string | null };
export type ReviewStatus = "pending" | "processing" | "completed" | "failed" | "unknown";

export type Review = {
  id: string;
  resumeId: string | null;
  paymentId: string | null;
  resumeName: string | null;
  status: ReviewStatus;
  overallScore: number | null;
  overallMax: number | null;
  categoryScores: CategoryScore[];
  strengths: Finding[];
  weaknesses: Finding[];
  recommendations: Finding[];
  assessmentVersion: string | null;
  createdAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  /** Laravel's own disclaimer text for the assessment, when sent. */
  disclaimer: string | null;
  /** Processing attempts so far, the configured maximum, and whether a retry is allowed now. */
  attempts: number | null;
  maxAttempts: number | null;
  canRetry: boolean;
};

function toFindings(v: unknown): Finding[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((item): Finding[] => {
    if (typeof item === "string") return item.trim() ? [{ title: item, detail: null, category: null }] : [];
    if (!isObj(item)) return [];
    const title = str(pick(item, "title", "message", "text", "summary", "description"));
    if (!title) return [];
    const detail = str(pick(item, "detail", "details", "description", "explanation", "suggestion"));
    return [{ title, detail: detail && detail !== title ? detail : null, category: str(pick(item, "category", "section")) }];
  });
}

function toCategoryScores(v: unknown): CategoryScore[] {
  if (Array.isArray(v)) {
    return v.flatMap((item): CategoryScore[] => {
      if (!isObj(item)) return [];
      const name = str(pick(item, "name", "category", "label", "key"));
      const score = num(pick(item, "score", "value", "points"));
      if (!name || score === null) return [];
      return [{ name, score, max: num(pick(item, "max_score", "max", "out_of", "max_points")) }];
    });
  }
  if (isObj(v)) {
    return Object.entries(v).flatMap(([name, val]): CategoryScore[] => {
      const score = isObj(val) ? num(pick(val, "score", "value")) : num(val);
      if (score === null) return [];
      return [{ name, score, max: isObj(val) ? num(pick(val, "max_score", "max", "out_of")) : null }];
    });
  }
  return [];
}

function toStatus(raw: string | null, hasScore: boolean): ReviewStatus {
  const s = raw?.toLowerCase();
  if (s === "pending" || s === "queued") return "pending";
  if (s === "processing" || s === "in_progress" || s === "running") return "processing";
  if (s === "completed" || s === "complete" || s === "done" || s === "succeeded") return "completed";
  if (s === "failed" || s === "error") return "failed";
  return hasScore ? "completed" : "unknown";
}

export function toReview(raw: unknown): Review | null {
  let o = unwrap(raw);
  if (isObj(o) && isObj(o.review)) o = o.review;
  if (!isObj(o)) return null;
  const id = str(o.id);
  if (!id) return null;
  const result = isObj(o.result) ? o.result : isObj(o.results) ? o.results : o;
  const overall = num(pick(result, "overall_score", "score", "overall")) ?? num(pick(o, "overall_score", "score"));
  const resume = isObj(o.resume) ? toResume(o.resume) : null;
  return {
    id,
    resumeId: str(pick(o, "resume_id")) ?? resume?.id ?? null,
    paymentId: str(o.payment_id),
    resumeName: resume?.fileName ?? str(pick(o, "resume_name", "file_name")),
    status: toStatus(str(o.status), overall !== null),
    overallScore: overall,
    overallMax: num(pick(result, "overall_max", "max_score")) ?? num(pick(o, "max_score")),
    categoryScores: toCategoryScores(pick(result, "category_scores", "categories", "scores")),
    strengths: toFindings(pick(result, "strengths", "positives", "positive_findings")),
    weaknesses: toFindings(pick(result, "weaknesses", "issues", "findings")),
    recommendations: toFindings(pick(result, "recommendations", "suggestions")),
    assessmentVersion: str(pick(result, "assessment_version", "version")) ?? str(pick(o, "assessment_version")),
    createdAt: str(pick(o, "created_at", "submitted_at")),
    completedAt: str(pick(o, "completed_at", "processed_at")),
    failureReason: str(pick(o, "failure_reason", "error", "error_message")),
    disclaimer: str(o.disclaimer),
    attempts: num(o.attempts),
    maxAttempts: num(o.max_attempts),
    canRetry: o.can_retry === true,
  };
}
