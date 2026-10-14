/** Admin client vs. the Laravel "Admin API" contract: exact paths, methods, bodies and shapes. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi, query } from "@/lib/laravel/admin";
import { toCandidate } from "@/lib/laravel/types";

const BASE = "https://api.test/api/v1";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const page = (data: unknown[]) => ({ data, links: {}, meta: { current_page: 1, last_page: 1, per_page: 15, total: data.length } });

function mockFetch(...responses: Response[]) {
  const m = vi.spyOn(globalThis, "fetch");
  for (const r of responses) m.mockResolvedValueOnce(r);
  return m;
}
const sent = (m: ReturnType<typeof mockFetch>, i = 0) => {
  const [url, init] = m.mock.calls[i]! as [string, RequestInit];
  return { url: String(url), method: init.method, body: typeof init.body === "string" ? JSON.parse(init.body) : init.body, auth: (init.headers as Record<string, string>).Authorization };
};

const user = { id: 7, name: "Ada", email: "ada@example.com" };
const payment = {
  id: 1, user_id: 7, user, resume_id: 3, reference: "CP-01J", amount: 600000, currency: "NGN", status: "verified",
  entitlement_status: "consumed", review_id: 9, provider_transaction_id: "4099", verified_at: "2026-10-14T10:00:00Z",
  refunded_at: null, refund_note: null, created_at: "2026-10-14T09:00:00Z", updated_at: "2026-10-14T10:00:00Z",
};

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test"));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("admin client", () => {
  it("builds filter queries without empty values", () => {
    expect(query({ status: "verified", reference: "", user_id: undefined, page: 2 })).toBe("?status=verified&page=2");
    expect(query({})).toBe("");
  });

  it("GET /admin/payments with filters and maps AdminPayment", async () => {
    const m = mockFetch(json(page([payment])));
    const res = await adminApi.payments("t", { status: "verified", reference: "CP-01J", page: 1 });
    expect(sent(m).url).toBe(`${BASE}/admin/payments?status=verified&reference=CP-01J&page=1`);
    expect(sent(m).auth).toBe("Bearer t");
    expect(res.items[0]).toMatchObject({ id: "1", status: "verified", entitlementStatus: "consumed", reviewId: "9", user: { id: "7", email: "ada@example.com" } });
  });

  it("POST /admin/payments/{id}/mark-refunded with { note }", async () => {
    const m = mockFetch(json({ data: { ...payment, status: "refunded", refunded_at: "2026-10-14T11:00:00Z", refund_note: "Paystack refund" } }));
    const res = await adminApi.markRefunded("t", "1", "Paystack refund");
    expect([sent(m).method, sent(m).url, sent(m).body]).toEqual(["POST", `${BASE}/admin/payments/1/mark-refunded`, { note: "Paystack refund" }]);
    expect([res.status, res.refundNote]).toEqual(["refunded", "Paystack refund"]);
  });

  it("POST /admin/payments/{id}/reverify reads meta.verified and provider_status", async () => {
    const m = mockFetch(json({ data: { ...payment, status: "initialized" }, meta: { verified: false, provider_status: "abandoned" } }));
    const res = await adminApi.reverifyPayment("t", "1");
    expect([sent(m).method, sent(m).url, sent(m).body]).toEqual(["POST", `${BASE}/admin/payments/1/reverify`, undefined]);
    expect([res.verified, res.providerStatus, res.payment.status]).toEqual([false, "abandoned", "initialized"]);
  });

  it("POST /admin/reviews/{id}/retry (optional resume_id) and grant-attempt", async () => {
    const review = { id: 9, status: "failed", user_id: 7, user, extra_attempts: 1, payment_status: "verified", attempts: 3, max_attempts: 4, can_retry: true, payment_id: 1 };
    const m = mockFetch(json({ data: review }), json({ data: review }), json({ data: review }));
    await adminApi.retryReview("t", "9");
    expect([sent(m, 0).url, sent(m, 0).body]).toEqual([`${BASE}/admin/reviews/9/retry`, {}]);
    await adminApi.retryReview("t", "9", "4");
    expect(sent(m, 1).body).toEqual({ resume_id: 4 });
    const granted = await adminApi.grantAttempt("t", "9");
    expect([sent(m, 2).method, sent(m, 2).url]).toEqual(["POST", `${BASE}/admin/reviews/9/grant-attempt`]);
    expect([granted.extraAttempts, granted.maxAttempts, granted.paymentStatus, granted.paymentId]).toEqual([1, 4, "verified", "1"]);
  });

  it("maps /admin/stats including revenue and refunds per currency", async () => {
    mockFetch(
      json({
        data: {
          period: { from: null, to: null },
          users: { total: 3, candidate: 2, admin: 1 },
          resumes: { total: 3, pending: 0, succeeded: 2, failed: 1 },
          payments: { total: 2, pending: 0, initialized: 0, verified: 1, failed: 0, refunded: 1 },
          reviews: { total: 2, pending: 0, completed: 1, failed: 1, retryable_failed: 1 },
          revenue: [{ currency: "NGN", amount: 600000, payments: 1 }],
          refunds: [{ currency: "NGN", amount: 600000, payments: 1 }],
        },
      }),
    );
    const s = await adminApi.stats("t");
    expect(s.reviews.retryableFailed).toBe(1);
    expect(s.revenue).toEqual([{ currency: "NGN", amount: 600000, payments: 1 }]);
    expect(s.payments.refunded).toBe(1);
  });

  it("maps GET /admin/users/{id} with latest lists", async () => {
    mockFetch(json({ data: { ...user, role: "candidate", resumes_count: 1, payments_count: 1, reviews_count: 0, latest_resumes: [{ id: 3, original_name: "cv.pdf", extraction_status: "failed" }], latest_payments: [payment], latest_reviews: [] } }));
    const u = await adminApi.user("t", "7");
    expect([u.role, u.resumesCount, u.latestResumes[0]!.extractionStatus, u.latestPayments.length]).toEqual(["candidate", 1, "failed", 1]);
  });

  it("reads role from /auth/user, defaulting anything unexpected to candidate", () => {
    expect(toCandidate({ data: { id: 1, role: "admin" } })!.role).toBe("admin");
    expect(toCandidate({ data: { id: 1, role: "superuser" } })!.role).toBe("candidate");
    expect(toCandidate({ data: { id: 1 } })!.role).toBe("candidate");
  });
});
