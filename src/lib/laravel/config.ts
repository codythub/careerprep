/**
 * Laravel CareerPrep API — single source of configuration (client-safe).
 *
 * Routes follow the CareerPrep Laravel API contract (base /api/v1, Sanctum bearer tokens,
 * supports_credentials=false). If the backend changes a route, change it HERE only.
 */

/** Base URL of the Laravel API, e.g. https://api.careerprep.app (with or without /api/v1). */
export function apiBaseUrl(): string {
  // NEXT_PUBLIC_ so the browser can call Laravel directly (bearer-token API, no cookies).
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!raw) throw new Error("NEXT_PUBLIC_API_URL is not set. Point it at the Laravel CareerPrep API.");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

export const ENDPOINTS = {
  // Public price of one review — { data: { review: { amount (kobo), currency, available } } }
  pricing: "/pricing", // GET (no token)
  // Auth — responses are { data: User, token: string, expires_at: string | null }
  register: "/auth/register", // POST
  login: "/auth/login", // POST
  user: "/auth/user", // GET
  logout: "/auth/logout", // POST
  // Profile
  profile: "/profile", // GET, PATCH
  // Resumes — list is paginated (data, links, meta; 15 per page)
  resumes: "/resumes", // GET, POST multipart field "resume"
  resume: (id: string | number) => `/resumes/${encodeURIComponent(String(id))}`, // GET, DELETE (204)
  // Payments — POST { resume_id } returns data.id + data.authorization_url; list filters by ?reference=
  payments: "/payments", // GET (paginated), POST
  payment: (paymentId: string | number) => `/payments/${encodeURIComponent(String(paymentId))}`, // GET
  paymentVerify: (paymentId: string | number) => `/payments/${encodeURIComponent(String(paymentId))}/verify`, // POST
  // Reviews — POST { payment_id }; list is paginated and filters by ?resume_id=
  reviews: "/reviews", // GET, POST
  review: (id: string | number) => `/reviews/${encodeURIComponent(String(id))}`, // GET
  reviewRetry: (id: string | number) => `/reviews/${encodeURIComponent(String(id))}/retry`, // POST { resume_id? }
  reviewDownload: (id: string | number) => `/reviews/${encodeURIComponent(String(id))}/download`, // GET
} as const;

const seg = (id: string | number) => encodeURIComponent(String(id));

/** Admin API (/api/v1/admin) — every route is admin-only on the server (401/403 otherwise). */
export const ADMIN_ENDPOINTS = {
  stats: "/admin/stats", // GET ?from&to (YYYY-MM-DD)
  users: "/admin/users", // GET ?search&role&page
  user: (id: string | number) => `/admin/users/${seg(id)}`, // GET (+ latest_resumes/payments/reviews)
  resumes: "/admin/resumes", // GET ?user_id&extraction_status&page
  resume: (id: string | number) => `/admin/resumes/${seg(id)}`, // GET
  resumeDownload: (id: string | number) => `/admin/resumes/${seg(id)}/download`, // GET (PDF, audited)
  payments: "/admin/payments", // GET ?status&reference&user_id&from&to&page
  payment: (id: string | number) => `/admin/payments/${seg(id)}`, // GET
  paymentReverify: (id: string | number) => `/admin/payments/${seg(id)}/reverify`, // POST
  paymentMarkRefunded: (id: string | number) => `/admin/payments/${seg(id)}/mark-refunded`, // POST { note }
  reviews: "/admin/reviews", // GET ?status&user_id&resume_id&page
  review: (id: string | number) => `/admin/reviews/${seg(id)}`, // GET
  reviewRetry: (id: string | number) => `/admin/reviews/${seg(id)}/retry`, // POST { resume_id? }
  reviewGrantAttempt: (id: string | number) => `/admin/reviews/${seg(id)}/grant-attempt`, // POST
  auditLog: "/admin/audit-log", // GET ?actor_id&action&page
} as const;

/** Multipart field name Laravel expects for the uploaded PDF. */
export const RESUME_UPLOAD_FIELD = "resume";

/** Backend limits mirrored for instant client feedback (Laravel still validates). */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPT = "application/pdf,.pdf";

/** Laravel list pages hold 15 records. */
export const PAGE_SIZE = 15;

/** Browser storage keys (client-side auth — the API does not use cookies). */
export const TOKEN_STORAGE_KEY = "careerprep.token";
export const TOKEN_EXPIRY_STORAGE_KEY = "careerprep.tokenExpiresAt";
export const PENDING_PAYMENT_STORAGE_KEY = "careerprep.pendingPayment";
