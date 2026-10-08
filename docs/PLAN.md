# Implementation Plan — V1

**Positioning:** Prepare Better. Apply Smarter.
**Scope rule:** No AI matching, interview simulation or other advanced features in V1. No fabricated testimonials, statistics or eligibility claims.

## 1. Stack decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, Server Components, Server Actions), TypeScript strict | SSR/SSG for SEO; server-only code for payments/admin |
| Styling | Tailwind CSS + small in-house component set (Button, Card, Badge, Input, Select, Table, Dialog, Tabs) | Lightweight; no heavy UI kit |
| DB | PostgreSQL (Supabase) + Prisma 6 | Pooled `DATABASE_URL`, `DIRECT_URL` for migrations |
| Auth | Auth.js v5 (email + password, bcrypt), Prisma adapter, JWT sessions carrying `role` | Keeps users in our DB; Google sign-in can be added later |
| Files | **Supabase Storage**, private buckets, short-lived signed URLs | Resumes are personal data; Cloudinary is image-oriented and public by default. Public bucket only for testimonial/story/article images |
| Payments | Paystack (initialize server-side → hosted checkout → webhook + verify) | See §4 |
| Email | Resend + React Email templates | Transactional only |
| Validation | Zod on every form and route handler | Shared client/server |
| Content | Markdown stored in DB, rendered with sanitization | Admin CMS for guides and jobs |
| Hosting | Vercel + Vercel Analytics / Speed Insights | Basic analytics without cookies |

## 2. Route map

**Public:** `/` · `/resume-optimization` · `/jobs` (filters via URL query) · `/jobs/[slug]` · `/jobs/category/[slug]` · `/hiring` (employer submission) · `/guides` · `/guides/[slug]` · `/success-stories` · `/success-stories/[slug]` · `/interview-preparation` · `/about` · `/contact` · `/privacy` · `/terms` · `/refund-policy` · `/disclaimer` · `/login` · `/register` · `/forgot-password`

**User dashboard `/dashboard`:** overview · `resume` · `orders` · `orders/[id]` · `orders/new` · `jobs/recommended` · `jobs/saved` · `applications` · `interview-prep` · `profile` · `notifications`

**Admin `/admin`** (role-gated in middleware *and* re-checked in every action): overview · `orders` · `orders/[id]` · `users` · `jobs` · `jobs/new` · `jobs/[id]` · `submissions` · `reports` · `testimonials` · `stories` · `guides` · `payments` · `analytics` · `settings`

**API routes:** `/api/auth/[...nextauth]` · `/api/paystack/webhook` · `/api/paystack/verify` (callback) · `/api/files/[id]` (signed-URL redirect after ownership check) · `/api/jobs/[id]/apply` (logs click, redirects) · `/api/cron/expire-jobs` (Vercel Cron, daily)

## 3. Key product rules → implementation

- **Remote vs Nigeria Eligible:** `workMode` and `nigeriaEligibility` are separate fields. `nigeriaEligibility` defaults to `UNVERIFIED`; the "Nigeria Eligible" badge and filter only show `VERIFIED` jobs. Unverified remote jobs show "Check eligibility before applying".
- **Nothing publishes unreviewed:** employer submissions land as `PENDING`; approving one creates a `Job` in `DRAFT` so the admin can set category, level and eligibility before publishing.
- **Sponsored/featured** jobs always render a visible label.
- **Job reports:** "Report this listing" on every job page (logged-in or email). Admin gets a reports queue; 3+ open reports send an alert email.
- **Expiry:** a daily cron marks jobs past `closingDate` as `EXPIRED`; admin can also expire jobs by hand.
- **Testimonials:** customers submit them from a delivered order (linked through `orderId`, with explicit consent). Only `APPROVED` rows appear. "Verified" means linked to a real order. With no data, the section is hidden, never filled with placeholders.
- **Success stories:** admin-authored, with `consentToPublish` and `isVerified` required before publishing (enforced server-side).
- **No guarantees:** disclaimer copy near every CTA and at checkout; nothing like "get hired" appears anywhere.

## 4. Resume order + payment flow

1. The user registers and verifies their email.
2. `/dashboard/orders/new`: the user uploads a resume (PDF/DOCX, ≤ 5 MB, MIME + magic-byte check) and enters the target role, industry, level and notes. This creates a `ResumeOrder(PENDING_PAYMENT)` with the price snapshot taken from `Setting.resume_price_kobo` (600000).
3. A server action creates a `Payment(PENDING)` with a unique reference, calls Paystack `transaction/initialize` (amount from the DB, never the client), and redirects to the checkout.
4. Payment is confirmed only on the server, by **either**:
   - the webhook (`x-paystack-signature` HMAC-SHA512 check), **or**
   - the callback, which calls `GET /transaction/verify/:reference`.

   Both paths run one idempotent `confirmPayment(reference)`: status `success`, amount == `amountKobo`, currency `NGN`. It then updates the Payment to `SUCCESS` and the Order to `PAID` in one transaction, writes the status history, notifies the user and sends an email. Repeat calls do nothing.
5. The admin moves the order through `RECEIVED → IN_REVIEW → PROCESSING → COMPLETED`, uploads the PDF + DOCX (+ profile recommendations), then marks it `DELIVERED`. Each step sends a notification (with email at Paid and Delivered).
6. `CANCELLED` / `REFUNDED` exist for the refund policy. Refunds are handled manually in the Paystack dashboard and then recorded.

## 5. Security baseline

Role checks on the server for every admin action · Zod validation · Rate limiting (Upstash or DB-based) on login, register, employer submission, job report and payment init · Honeypot + Turnstile on public forms · Private files served only through ownership-checked signed URLs (60 s) · Markdown sanitized · Security headers/CSP via `next.config` · Audit log for admin mutations · No secrets in client bundles.

## 6. Phases & deliverables

| # | Phase | Done when |
|---|---|---|
| 1 | Setup, DB, auth, design system | Next app runs; Prisma migrated + seeded (categories, admin, settings); register/login/logout/reset works; component library page |
| 2 | Homepage + public pages | All 12 homepage sections (data-driven sections hide when empty); legal pages drafted; responsive |
| 3 | Resume workflow | Upload → order → Paystack (test mode) → Paid confirmed server-side |
| 4 | Job board | List + filters + pagination + detail + save + report + apply-click tracking; JobPosting JSON-LD |
| 5 | Employer submission + approval | `/hiring` form → pending queue → approve/reject with email to recruiter |
| 6 | User dashboard | All 9 nav sections functional (recommended jobs = simple category/level match) |
| 7 | Admin dashboard | Orders, users, jobs CRUD/feature/expire, submissions, reports, payments, settings |
| 8 | Testimonials, stories, guides | Admin CMS + public pages; customer testimonial submission |
| 9 | Payments, emails, notifications, hardening | Webhook, all email templates, rate limits, headers, audit log |
| 10 | SEO, analytics, perf, deploy | Sitemap, robots, OG images, metadata; Lighthouse ≥ 90 on mobile; Vercel prod + env + cron |

## 7. Environment variables

```
DATABASE_URL, DIRECT_URL
AUTH_SECRET, AUTH_URL
PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY, EMAIL_FROM, ADMIN_ALERT_EMAIL
NEXT_PUBLIC_SITE_URL, CRON_SECRET
```

## 8. Schema summary

See `prisma/schema.prisma`, which passes `prisma validate`.

- **Auth:** User (role USER/ADMIN, profile fields), Account, Session, VerificationToken, PasswordResetToken
- **Resume:** Resume (uploaded file) → ResumeOrder (status, price snapshot, assignee) → Payment, OrderDeliverable (PDF/DOCX, versioned), OrderStatusHistory
- **Jobs:** JobCategory (15 seeded), Job (workMode ≠ nigeriaEligibility, featured/sponsored, status), EmployerSubmission (→ Job on approval), JobReport, SavedJob, Application (user tracker), JobApplyClick
- **Proof/content:** Testimonial (moderated, order-linked, consent), SuccessStory (consent + verified before publish), Article (guides CMS)
- **Platform:** Notification, Setting (key/value), AuditLog

## 9. Implementation decision log (V1 build)

Decisions made during the build where the brief was silent. Each follows the rule "simplest secure option".

- **Next.js 16**: route protection lives in `src/proxy.ts` (the renamed middleware). It is a first gate only. Every page and server action re-checks authorization with `requireUser` / `requireAdmin`, which re-read the role from the database. Non-admins get a 404 on admin routes.
- **Auth**: Auth.js credentials provider with JWT sessions (7 days) and bcrypt cost 12. The Prisma adapter is not needed for credentials-only sign-in; the Account/Session tables are kept for future OAuth. Email verification is **not** required before ordering, to reduce friction. Password reset tokens are stored as SHA-256 hashes and expire after 1 hour.
- **Uploads**: the limit is **4 MB**, not 5 MB, because Vercel caps request bodies at 4.5 MB. Files are identified by magic bytes (PDF header, or a DOCX ZIP containing `word/document.xml`); the extension and the browser-supplied MIME type are ignored.
- **Storage**: `src/server/storage.ts` uses Supabase in production. The local driver (signed, expiring URLs) exists for development and is refused in production.
- **Payments**:
  - `confirmPayment` is the only code path that sets an order to PAID. It checks status, reference, amount against the order snapshot, and NGN currency.
  - Idempotency comes from a conditional `updateMany` inside a transaction plus a unique `paystackId`.
  - Every signal is appended to the new `PaymentEvent` table.
  - Paystack signs webhooks with the secret key, so there is no separate webhook secret.
- **Order statuses**: `PAID` can never be set manually. DELIVERED requires an uploaded final file. Customers see final files only once the order is DELIVERED.
- **Jobs**:
  - Publishing requires `companyVerified` (the admin confirmed the employer is genuine) and a future closing date.
  - `VERIFIED` Nigeria eligibility requires a note and records who verified it and when.
  - Demo jobs have `isDemo = true`. They are labelled, set to `noindex`, and left out of the sitemap and JSON-LD.
- **Salary filter**: "Salary listed" plus a "highest salary" sort, instead of a numeric range, because listings use mixed currencies (NGN, USD, …).
- **Testimonials**: submitted only from the customer's own COMPLETED or DELIVERED order, with a consent checkbox. "Verified" means linked to that order. Only approved testimonials are shown, and the homepage section is hidden when there are none.
- **Success stories**: status changed to `ModerationStatus`, and fields added for `careerField`, `improvements` and `isFeatured`. Approval requires all of the following, and editing away consent or verification unpublishes the story:
  - a linked user with a paid order
  - recorded consent
  - a verified outcome
- **Schema additions**:
  - New tables: `PaymentEvent`, `AnalyticsEvent` (a replaceable first-party analytics sink) and `RateLimit` (a Postgres-backed limiter, so no Redis is needed).
  - New fields: `ResumeOrder.termsAcceptedAt`; Job responsibilities/requirements/applicationInstructions/isDemo/companyVerified; submission responsibilities/requirements/experienceLevel.
  - Extra indexes for the job filters.
- **Rate limits**: login, register, password reset, employer submission, job report, payment init, uploads, testimonials and the analytics beacon. Public forms also have a honeypot. Turnstile was deferred (it's optional and would need a CSP change).
- **Email**: plain HTML templates with escaped values and the brand taken from config (no React Email dependency). Without `RESEND_API_KEY`, emails are logged to the console.
- **Markdown**: rendered with react-markdown with raw HTML skipped (XSS-safe) and external links set to `nofollow noopener`.
- **Caching**: marketing pages use ISR (5 minutes) and admin mutations call `revalidatePath`. The header's sign-in state is fetched client-side so public pages stay cacheable.
- **Routes**: the brief's names are used — `/career-guides`, `/employers`, `/employers/post-job`, `/dashboard/saved-jobs`. They replace the earlier `/guides` and `/hiring`.
