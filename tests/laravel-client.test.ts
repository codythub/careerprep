/**
 * Frontend API client vs. the CareerPrep Laravel API contract (base /api/v1, Sanctum bearer
 * tokens, supports_credentials=false). Each test pins the exact method, path and body.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, laravel } from "@/lib/laravel/client";
import { api, uploadResume } from "@/lib/laravel/api";
import { toCandidate, toPage, toPaymentVerification, toResume, toReview } from "@/lib/laravel/types";

const BASE = "https://api.test/api/v1";

/** Resolves to the ApiError a call rejects with (fails the test if it resolves). */
const failure = (p: Promise<unknown>): Promise<ApiError> =>
  p.then(
    () => {
      throw new Error("expected the call to fail");
    },
    (e: unknown) => e as ApiError,
  );

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

const user = { id: 7, name: "Ada Obi", email: "ada@example.com" };

function mockFetch(...responses: Response[]) {
  const m = vi.spyOn(globalThis, "fetch");
  for (const r of responses) m.mockResolvedValueOnce(r);
  return m;
}

/** The single request the call made: URL, method, headers, parsed JSON body. */
function sent(m: ReturnType<typeof mockFetch>, i = 0) {
  const [url, init] = m.mock.calls[i]! as [string, RequestInit];
  return {
    url: String(url),
    method: init.method,
    headers: init.headers as Record<string, string>,
    body: typeof init.body === "string" ? (JSON.parse(init.body) as unknown) : init.body,
    credentials: init.credentials,
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("transport: bearer token, never cookies", () => {
  it("prefixes /api/v1, sends Authorization: Bearer and omits credentials", async () => {
    const m = mockFetch(json({ data: user }));
    await api.user("1|tok");
    const r = sent(m);
    expect(r.url).toBe(`${BASE}/auth/user`);
    expect(r.method).toBe("GET");
    expect(r.headers).toMatchObject({ Authorization: "Bearer 1|tok", Accept: "application/json" });
    expect(r.credentials).toBe("omit");
    expect(Object.keys(r.headers).map((k) => k.toLowerCase())).not.toContain("cookie");
  });

  it("does not double the /api/v1 prefix", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test/api/v1/");
    const m = mockFetch(json({ data: [], meta: {} }));
    await api.listResumes("t");
    expect(sent(m).url).toBe(`${BASE}/resumes?page=1`);
  });

  it("maps 422 validation errors to field errors", async () => {
    mockFetch(json({ message: "The email has already been taken.", errors: { email: ["The email has already been taken."] } }, 422));
    const err = await failure(laravel("/auth/register", { method: "POST", json: {} }));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.fieldErrors.email).toEqual(["The email has already been taken."]);
  });

  it("flags 401 as unauthorized and hides server error details", async () => {
    mockFetch(json({ message: "Unauthenticated." }, 401));
    expect((await failure(api.user("expired"))).isUnauthorized).toBe(true);
    mockFetch(json({ message: "SQLSTATE[...] stack trace" }, 500));
    expect((await failure(api.listReviews("t"))).message).not.toContain("SQLSTATE");
  });

  it("reports network failures as a friendly error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const err = await failure(api.user("t"));
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});

describe("auth: { data: User, token }", () => {
  it("POST /auth/register with the registration fields", async () => {
    const m = mockFetch(json({ data: user, token: "1|reg" }, 201));
    const input = { name: "Ada Obi", email: "ada@example.com", password: "secret-pass", password_confirmation: "secret-pass" };
    const res = await api.register(input);
    expect(res.token).toBe("1|reg");
    expect(res.user?.email).toBe("ada@example.com");
    const r = sent(m);
    expect([r.method, r.url]).toEqual(["POST", `${BASE}/auth/register`]);
    expect(r.body).toEqual(input);
    expect(r.headers.Authorization).toBeUndefined();
  });

  it("POST /auth/login returns the token; a response without one is rejected", async () => {
    const m = mockFetch(json({ data: user, token: "1|abc" }));
    expect((await api.login({ email: "ada@example.com", password: "x" })).token).toBe("1|abc");
    expect([sent(m).method, sent(m).url]).toEqual(["POST", `${BASE}/auth/login`]);
    expect(sent(m).body).toEqual({ email: "ada@example.com", password: "x" });

    mockFetch(json({ data: user }));
    await expect(api.login({ email: "a@b.c", password: "x" })).rejects.toBeInstanceOf(ApiError);
  });

  it("GET /auth/user unwraps data; POST /auth/logout sends the bearer token", async () => {
    const m = mockFetch(json({ data: user }), new Response(null, { status: 204 }));
    expect((await api.user("t")).name).toBe("Ada Obi");
    await api.logout("t");
    const r = sent(m, 1);
    expect([r.method, r.url, r.headers.Authorization]).toEqual(["POST", `${BASE}/auth/logout`, "Bearer t"]);
  });
});

describe("profile", () => {
  it("GET /profile and PATCH /profile (not PUT)", async () => {
    const m = mockFetch(json({ data: { ...user, professional_title: "Analyst" } }), json({ data: { ...user, location: "Lagos" } }));
    expect((await api.getProfile("t")).professionalTitle).toBe("Analyst");
    const input = { name: "Ada Obi", email: "ada@example.com", phone: null, location: "Lagos", professional_title: null };
    expect((await api.updateProfile("t", input))?.location).toBe("Lagos");
    const r = sent(m, 1);
    expect([r.method, r.url]).toEqual(["PATCH", `${BASE}/profile`]);
    expect(r.body).toEqual(input);
  });
});

describe("resumes", () => {
  it("GET /resumes is paginated (data, links, meta; 15 per page)", async () => {
    const m = mockFetch(
      json({
        data: [{ id: 1, original_name: "cv.pdf" }],
        links: { first: `${BASE}/resumes?page=1`, next: `${BASE}/resumes?page=3` },
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      }),
    );
    const page = await api.listResumes("t", 2);
    expect(sent(m).url).toBe(`${BASE}/resumes?page=2`);
    expect(page).toMatchObject({ currentPage: 2, lastPage: 3, perPage: 15, total: 31 });
    expect(page.items[0]!.fileName).toBe("cv.pdf");
  });

  it("GET /resumes/{resume}; DELETE /resumes/{resume} handles 204", async () => {
    const m = mockFetch(json({ data: { id: 5, original_name: "cv.pdf" } }), new Response(null, { status: 204 }));
    expect((await api.getResume("t", "5")).id).toBe("5");
    await expect(api.deleteResume("t", "5")).resolves.toBeUndefined();
    expect([sent(m, 0).method, sent(m, 0).url]).toEqual(["GET", `${BASE}/resumes/5`]);
    expect([sent(m, 1).method, sent(m, 1).url]).toEqual(["DELETE", `${BASE}/resumes/5`]);
  });

  it("POST /resumes multipart with field \"resume\", bearer token and no credentials", async () => {
    const calls: { method?: string; url?: string; headers: Record<string, string>; body?: FormData; withCredentials?: boolean } = { headers: {} };
    class FakeXHR {
      status = 201;
      responseText = JSON.stringify({ data: { id: 11, original_name: "cv.pdf", size: 1024 } });
      withCredentials = true;
      upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open(method: string, url: string) {
        calls.method = method;
        calls.url = url;
      }
      setRequestHeader(k: string, v: string) {
        calls.headers[k] = v;
      }
      send(body: FormData) {
        calls.body = body;
        calls.withCredentials = this.withCredentials;
        this.upload.onprogress?.({ lengthComputable: true, loaded: 1024, total: 1024 });
        this.onload?.();
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXHR);
    const progress: number[] = [];
    const file = new File([new Uint8Array(1024)], "cv.pdf", { type: "application/pdf" });
    const resume = await uploadResume("1|tok", file, (p) => progress.push(p));
    expect(resume?.id).toBe("11");
    expect([calls.method, calls.url]).toEqual(["POST", `${BASE}/resumes`]);
    expect(calls.headers).toMatchObject({ Authorization: "Bearer 1|tok", Accept: "application/json" });
    expect(calls.withCredentials).toBe(false);
    expect([...calls.body!.keys()]).toEqual(["resume"]);
    expect((calls.body!.get("resume") as File).name).toBe("cv.pdf");
    expect(progress).toEqual([100]);
  });
});

describe("payments", () => {
  it("POST /payments with ONLY { resume_id: number } and returns data.id + authorization_url", async () => {
    const m = mockFetch(json({ data: { id: 42, authorization_url: "https://checkout.paystack.com/xyz", reference: "R1" } }, 201));
    expect(await api.createPayment("t", "1")).toEqual({ paymentId: 42, authorizationUrl: "https://checkout.paystack.com/xyz" });
    const r = sent(m);
    expect([r.method, r.url]).toEqual(["POST", `${BASE}/payments`]);
    // No reference, amount, currency, status or callback URL from the frontend.
    expect(r.body).toEqual({ resume_id: 1 });
  });

  it("rejects responses without a payment ID or with a non-https checkout URL", async () => {
    mockFetch(json({ data: { authorization_url: "https://checkout.paystack.com/xyz" } }));
    await expect(api.createPayment("t", 1)).rejects.toBeInstanceOf(ApiError);
    mockFetch(json({ data: { id: 1, authorization_url: "javascript:alert(1)" } }));
    await expect(api.createPayment("t", 1)).rejects.toBeInstanceOf(ApiError);
  });

  it("verifies with POST /payments/{payment}/verify and no body (there is no GET verify)", async () => {
    const m = mockFetch(json({ data: { id: 42, status: "success", reference: "R1" } }));
    const v = await api.verifyPayment("t", 42);
    expect(v.verified).toBe(true);
    const r = sent(m);
    expect([r.method, r.url, r.body]).toEqual(["POST", `${BASE}/payments/42/verify`, undefined]);
  });
});

describe("reviews", () => {
  it("POST /reviews with ONLY { payment_id }", async () => {
    const m = mockFetch(json({ data: { id: 9, status: "pending" } }, 201));
    const review = await api.createReview("t", 42);
    expect([review.id, review.status]).toEqual(["9", "pending"]);
    const r = sent(m);
    expect([r.method, r.url]).toEqual(["POST", `${BASE}/reviews`]);
    expect(r.body).toEqual({ payment_id: 42 });
  });

  it("GET /reviews (paginated) and GET /reviews/{review}", async () => {
    const m = mockFetch(
      json({ data: [{ id: 9, status: "completed", overall_score: 70 }], links: {}, meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }),
      json({ data: { id: 9, status: "failed" } }),
    );
    const page = await api.listReviews("t");
    expect(sent(m, 0).url).toBe(`${BASE}/reviews?page=1`);
    expect(page.items[0]!.overallScore).toBe(70);
    expect((await api.getReview("t", "9")).status).toBe("failed");
    expect(sent(m, 1).url).toBe(`${BASE}/reviews/9`);
  });

  it("GET /reviews/{review}/download returns the file with its filename", async () => {
    const m = mockFetch(
      new Response(new Blob(["%PDF-1.4"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="review-9.pdf"' },
      }),
    );
    const { blob, fileName } = await api.downloadReview("t", "9");
    expect(fileName).toBe("review-9.pdf");
    expect(await blob.text()).toBe("%PDF-1.4");
    const r = sent(m);
    expect([r.method, r.url, r.headers.Authorization, r.credentials]).toEqual(["GET", `${BASE}/reviews/9/download`, "Bearer t", "omit"]);
  });
});

describe("response normalisers (rename only, never invent)", () => {
  it("reads pagination meta and falls back safely", () => {
    expect(toPage({ data: [{ id: 1 }], meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 } }, toResume).items).toHaveLength(1);
    expect(toPage({}, toResume)).toEqual({ items: [], currentPage: 1, lastPage: 1, total: 0, perPage: 0 });
  });

  it("maps users and resume metadata and leaves missing fields empty", () => {
    expect(toCandidate({ data: { id: 3, name: "Ada", professional_title: "Analyst" } })?.professionalTitle).toBe("Analyst");
    expect(toResume({ id: 5, original_name: "cv.pdf", size: 2048, created_at: "2026-10-01T10:00:00Z" })).toEqual({
      id: "5",
      fileName: "cv.pdf",
      sizeBytes: 2048,
      mimeType: null,
      uploadedAt: "2026-10-01T10:00:00Z",
      status: null,
    });
  });

  it("only treats explicit success statuses as a verified payment", () => {
    expect(toPaymentVerification({ data: { status: "success", reference: "R" } }).verified).toBe(true);
    expect(toPaymentVerification({ data: { status: "abandoned" } }).verified).toBe(false);
    expect(toPaymentVerification({ data: {} }).verified).toBe(false);
  });

  it("maps pending, completed and failed reviews", () => {
    const done = toReview({
      data: {
        id: 9,
        status: "completed",
        overall_score: 72,
        category_scores: [{ name: "Structure", score: 18, max_score: 25 }],
        weaknesses: ["No measurable achievements"],
        recommendations: [{ title: "Quantify results", description: "Add numbers to 3 bullets" }],
      },
    })!;
    expect(done.categoryScores).toEqual([{ name: "Structure", score: 18, max: 25 }]);
    expect(done.recommendations[0]).toMatchObject({ title: "Quantify results", detail: "Add numbers to 3 bullets" });
    expect(toReview({ data: { id: 1, status: "pending" } })!.status).toBe("pending");
    expect(toReview({ data: { id: 2, status: "failed" } })!.status).toBe("failed");
  });
});
