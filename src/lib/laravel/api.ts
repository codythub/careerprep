import { ENDPOINTS, RESUME_UPLOAD_FIELD, apiBaseUrl } from "@/lib/laravel/config";
import { ApiError, laravel, toApiError } from "@/lib/laravel/client";
import {
  toAuth,
  toCandidate,
  toPage,
  toPaymentInit,
  toPaymentVerification,
  toResume,
  toReview,
  type Candidate,
  type Page,
  type PaymentInit,
  type PaymentVerification,
  type Resume,
  type Review,
} from "@/lib/laravel/types";

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new ApiError(`The CareerPrep service returned an unexpected ${what} response.`, 502);
  return value;
}

/** Laravel IDs are numeric; send them as numbers exactly as the contract specifies. */
function numericId(id: string | number, what: string): number {
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(`Invalid ${what}.`, 400);
  return n;
}

export type ProfileInput = { name: string; email: string; phone: string | null; location: string | null; professional_title: string | null };

/** Typed client for the Laravel CareerPrep API (runs in the browser; bearer token, no cookies). */
export const api = {
  // ── Auth: POST register/login → { data: User, token } ──────────────────────
  async register(input: { name: string; email: string; password: string; password_confirmation: string }) {
    return required(toAuth(await laravel(ENDPOINTS.register, { method: "POST", json: input })), "registration");
  },
  async login(input: { email: string; password: string }) {
    return required(toAuth(await laravel(ENDPOINTS.login, { method: "POST", json: input })), "sign-in");
  },
  async user(token: string): Promise<Candidate> {
    return required(toCandidate(await laravel(ENDPOINTS.user, { token })), "user");
  },
  async logout(token: string) {
    await laravel(ENDPOINTS.logout, { method: "POST", token });
  },

  // ── Profile: GET / PATCH ───────────────────────────────────────────────────
  async getProfile(token: string): Promise<Candidate> {
    return required(toCandidate(await laravel(ENDPOINTS.profile, { token })), "profile");
  },
  async updateProfile(token: string, input: ProfileInput): Promise<Candidate | null> {
    return toCandidate(await laravel(ENDPOINTS.profile, { method: "PATCH", token, json: input }));
  },

  // ── Resumes (paginated list; DELETE returns 204) ───────────────────────────
  async listResumes(token: string, page = 1): Promise<Page<Resume>> {
    return toPage(await laravel(`${ENDPOINTS.resumes}?page=${page}`, { token }), toResume);
  },
  async getResume(token: string, id: string): Promise<Resume> {
    return required(toResume(await laravel(ENDPOINTS.resume(id), { token })), "resume");
  },
  async deleteResume(token: string, id: string): Promise<void> {
    await laravel(ENDPOINTS.resume(id), { method: "DELETE", token });
  },

  // ── Payments: POST { resume_id } → data.id + data.authorization_url ────────
  async createPayment(token: string, resumeId: string | number): Promise<PaymentInit> {
    const body = await laravel(ENDPOINTS.payments, { method: "POST", token, json: { resume_id: numericId(resumeId, "resume") } });
    return required(toPaymentInit(body), "payment");
  },
  /** POST /payments/{payment}/verify — no body; Laravel verifies with Paystack server-side. */
  async verifyPayment(token: string, paymentId: number): Promise<PaymentVerification> {
    return toPaymentVerification(await laravel(ENDPOINTS.paymentVerify(paymentId), { method: "POST", token }));
  },

  // ── Reviews: POST { payment_id }; paginated list ──────────────────────────
  async createReview(token: string, paymentId: number): Promise<Review> {
    const body = await laravel(ENDPOINTS.reviews, { method: "POST", token, json: { payment_id: numericId(paymentId, "payment") } });
    return required(toReview(body), "review");
  },
  async listReviews(token: string, page = 1): Promise<Page<Review>> {
    return toPage(await laravel(`${ENDPOINTS.reviews}?page=${page}`, { token }), toReview);
  },
  async getReview(token: string, id: string): Promise<Review> {
    return required(toReview(await laravel(ENDPOINTS.review(id), { token })), "review");
  },
  /** GET /reviews/{review}/download — returns the file as a Blob plus a suggested filename. */
  async downloadReview(token: string, id: string): Promise<{ blob: Blob; fileName: string }> {
    const res = await laravel<Response>(ENDPOINTS.reviewDownload(id), { token, raw: true });
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: await res.blob(), fileName: match ? decodeURIComponent(match[1]!) : `careerprep-review-${id}.pdf` };
  },
};

/**
 * POST /resumes (multipart, field "resume") via XHR so the UI can show upload progress.
 * Bearer token only; `withCredentials=false` so no cookies are sent.
 */
export function uploadResume(
  token: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<Resume | null> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append(RESUME_UPLOAD_FIELD, file, file.name);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBaseUrl()}${ENDPOINTS.resumes}`);
    xhr.withCredentials = false;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(toResume(data));
      else reject(toApiError(xhr.status, data));
    };
    xhr.onerror = () => reject(new ApiError("Network error — check your connection and try again.", 0));
    xhr.send(body);
  });
}
