# Backend integration (Laravel CareerPrep API)

The Laravel CareerPrep API (`/api/v1`) is this frontend's **only** backend. The frontend has no database,
no server actions that store data, no API routes and no secrets. The source of truth for the contract is the
Laravel project's `docs/FRONTEND_API.md`.

## How the frontend calls Laravel

| Concern | Implementation |
|---|---|
| Base URL | `NEXT_PUBLIC_API_URL`; `/api/v1` is appended if missing (`src/lib/laravel/config.ts`) |
| Endpoint paths | `ENDPOINTS` in `src/lib/laravel/config.ts`: change routes there only |
| HTTP client | `src/lib/laravel/client.ts`. Sends `Accept: application/json`, `Authorization: Bearer`, `credentials: "omit"`. Turns Laravel errors into `ApiError` (status plus 422 `errors`). |
| Typed calls | `src/lib/laravel/api.ts` (`api.*`, `uploadResume`) |
| Response shapes | `src/lib/laravel/types.ts`. Normalisers only rename fields Laravel sent; missing values stay `null`. |
| Token | `src/lib/laravel/token.ts`. The Sanctum token from login/register is kept in `localStorage`. |
| Session and guards | `src/components/candidate/auth.tsx`. `GET /auth/user` validates the token on load. Any 401 clears it and redirects to `/login?expired=1&callbackUrl=…`. `/dashboard/*` renders only for a validated user. |

All calls run in the browser. Laravel enforces auth and ownership on every request (another user's record → 404),
so the client-side guard only decides what to render; it is not a security boundary.

## Feature → endpoint map

| Feature (route) | Endpoint(s) | Verified against a running Laravel |
|---|---|---|
| Register (`/register`) | `POST /auth/register` | Yes, including 422 field errors |
| Sign in (`/login`) | `POST /auth/login` | Yes, including wrong password |
| Session check (all `/dashboard`) | `GET /auth/user` | Yes, including 401 for an invalid token |
| Sign out | `POST /auth/logout` | Yes (only that token is revoked) |
| Review price (home, resume review, payment card) | `GET /pricing` (no token); checkout disabled when `available` is false | Yes |
| Profile (`/dashboard/profile`) | `GET /profile`, `PATCH /profile` | Yes |
| Upload PDF (`/dashboard/resumes`) | `POST /resumes` (multipart field `resume`, PDF ≤ 5 MB) | Yes: text and image-only PDFs, non-PDF rejected (422). The browser XHR path is unit-tested only. |
| Resume list and detail | `GET /resumes?page=`, `GET /resumes/{id}` | Yes |
| Delete resume | `DELETE /resumes/{id}` (204; 409 if paid for) | 204 and 404-after-delete yes; 409 not exercised |
| Text extraction status | `extraction_status`, `extraction_error` on Resume | Yes (`succeeded` and `failed`) |
| Start checkout | `POST /payments { resume_id }` → redirect to `authorization_url` | Only the 503 "not configured" path. A real Paystack checkout needs Paystack keys. |
| Paystack return (`/dashboard/payments/callback`) | `GET /payments?reference=` → `POST /payments/{id}/verify` (falls back to `GET /payments/{id}`) | Reference lookup yes; a successful verify needs Paystack |
| Paid-but-unused review, unconfirmed payment | `GET /payments?page=` (`entitlement_status`, `review_id`) | Yes (verified payment inserted directly into a throwaway DB) |
| Retry a failed review | `POST /reviews/{id}/retry { resume_id? }` (`attempts`, `max_attempts`, `can_retry`) | UI verified against a failed review with `can_retry: true`; the retry call itself is unit-tested only |
| Run review | `POST /reviews { payment_id }` | Yes: completed review; second use → 422 |
| Review history and detail | `GET /reviews?page=&resume_id=`, `GET /reviews/{id}` | Yes |
| Download report | `GET /reviews/{id}/download` (`.txt`, filename in `Content-Disposition`) | Yes |
| Paystack webhook | Laravel `POST /api/v1/paystack/webhook`. **Not** called by the frontend. | n/a |

"Verified" means `tests/laravel-live.test.ts` (and a one-off review-flow script) ran the frontend's own client
against Laravel served locally with SQLite. It was not run against PostgreSQL, R2 or Paystack. Re-run it against
any non-production API:

```bash
LARAVEL_LIVE_URL=http://127.0.0.1:8000 npx vitest run tests/laravel-live.test.ts
```

## Admin area (`/admin`)

Built against the Laravel "Admin API" section of `docs/FRONTEND_API.md`. The `/admin` pages only render for a session
whose `GET /auth/user` returns `role: "admin"`. That check is UI only: Laravel re-checks the role on every admin request
(401 without a token, 403 for candidates). Admins are created on the server with `php artisan careerprep:make-admin {email}`.

| Screen | Endpoint(s) | Verified against a running Laravel |
|---|---|---|
| Overview (date range) | `GET /admin/stats?from&to` | Yes |
| Users, user detail | `GET /admin/users?search&role`, `GET /admin/users/{id}` | Yes |
| Payments, payment detail | `GET /admin/payments?status&reference&user_id&from&to`, `GET /admin/payments/{id}` | Yes |
| Re-verify payment | `POST /admin/payments/{id}/reverify` (shows `meta.verified` and `provider_status`) | Only the 502 path (Paystack unreachable). A real Paystack check needs keys. |
| Mark refunded | `POST /admin/payments/{id}/mark-refunded { note }`. Records a Paystack refund; moves no money. | Yes |
| Reviews, review detail | `GET /admin/reviews?status&user_id&resume_id`, `GET /admin/reviews/{id}` | Yes |
| Retry review (support override) | `POST /admin/reviews/{id}/retry { resume_id? }`, with staged progress | Yes |
| Grant extra attempt | `POST /admin/reviews/{id}/grant-attempt` | Yes |
| Resumes, resume detail, PDF download | `GET /admin/resumes?extraction_status&user_id`, `GET /admin/resumes/{id}`, `GET /admin/resumes/{id}/download` (audited) | Yes |
| Audit log | `GET /admin/audit-log?action&actor_id` | Yes |

Code: `src/lib/laravel/admin.ts` (client and normalisers), `src/components/admin/*` (shell, kit, views), `src/app/admin/*`.

## Missing backend contract

These parts of the old Prisma-backed frontend have **no Laravel endpoint**. They were removed rather than faked.
Each needs a Laravel API before it can return.

| Feature | Frontend today | What Laravel would need to provide |
|---|---|---|
| Job board (`/jobs`, `/jobs/[slug]`, categories, apply tracking, reporting) | `/jobs` says the board isn't open; detail and category routes return 404 | Public job list/detail/category endpoints, report endpoint, apply-click endpoint |
| Employer job submissions (`/employers/post-job`) | Asks employers to email support | Public submission endpoint (rate-limited, spam-protected) plus an admin review flow |
| Success stories and testimonials | Home sections hidden; `/success-stories` shows its empty state | Public read endpoints for consented, approved records |
| Career guides CMS | Guides are static content in `src/content/guides.ts`, edited in the repo | Optional: an articles endpoint, if guides should be edited without a deploy |
| Analytics events, email notifications, daily cron | Removed | Belong in Laravel if they are still wanted |

## Laravel configuration the frontend depends on

- `FRONTEND_URL` must equal this site's origin. CORS allows exactly one origin, so Vercel preview URLs are blocked
  unless Laravel adds them, e.g. with `allowed_origins_patterns`.
- `PAYSTACK_CALLBACK_URL` = `<site>/dashboard/payments/callback`.
- The Paystack dashboard webhook URL points at Laravel: `<api>/api/v1/paystack/webhook`.
- `Content-Disposition` stays in CORS `exposed_headers` (report filename).

## Known limitations

- **Token storage:** the bearer token sits in `localStorage`, and Sanctum tokens currently never expire. Any XSS
  bug would expose a long-lived token. The CSP limits script sources and `connect-src` to this site and the API
  origin. Laravel should set a Sanctum `expiration`; the frontend already handles the resulting 401s.
- A review uses up its entitlement even when it fails. The frontend turns off payment for resumes whose text
  could not be extracted, the known cause of failure.
- `POST /payments/{id}/verify` re-asks Paystack even for an already-verified payment. If that call errors, the
  callback page falls back to the stored status from `GET /payments/{id}`.
