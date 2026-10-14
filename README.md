# CareerPrep NG — frontend

**Prepare Better. Apply Smarter.** Automated, rule-based resume reviews paid through Paystack, plus career guides
for Nigerian professionals.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel. **Backend: the Laravel CareerPrep API** (`/api/v1`,
Sanctum bearer tokens, PostgreSQL, Paystack, private resume storage), which is a separate project.

> The brand is a placeholder. Change it in **`src/config/site.ts`** (name, tagline, domain, support email, social links)
> and the colour palette in `src/app/globals.css` (`--color-brand-*`).

## Architecture

This app has **no database, no server-side data access and no secrets**. Every piece of account data
comes from Laravel, called from the browser with the candidate's bearer token:

- `src/lib/laravel/`: the typed API client: config/endpoints, fetch wrapper, normalisers and token storage.
- `src/components/candidate/`: auth provider and `/dashboard` guard, forms, and the dashboard views.
- `src/content/guides.ts`: career guides (static content, prerendered).

See **[`docs/BACKEND.md`](docs/BACKEND.md)** for the feature → endpoint map (candidate dashboard and the `/admin` area),
which workflows have been verified against a running Laravel, and the backend contract that is still missing (job board,
employer submissions, stories/testimonials). Features without a Laravel endpoint are not shown with fake data: `/jobs`
and `/success-stories` say so plainly, and `/employers/post-job` asks employers to email.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Laravel base URL, e.g. `https://api.example.com` (`/api/v1` is appended if missing). Also added to the CSP `connect-src`. |
| `NEXT_PUBLIC_SITE_URL` | Production | This site's public URL (canonical URLs, sitemap, Open Graph). Defaults to `http://localhost:3000`. |
| `SITE_NOINDEX` | No | `true` keeps a preview/temporary deployment out of search engines. |

`NEXT_PUBLIC_*` values are inlined at **build** time, so a change needs a new deploy.

Delete these from Vercel if present — this app doesn't use them: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`,
`PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`EMAIL_FROM`, `ADMIN_ALERT_EMAIL`.

Laravel must have `FRONTEND_URL` set to this site's origin (CORS) and
`PAYSTACK_CALLBACK_URL=<site>/dashboard/payments/callback`. The Paystack webhook points at Laravel, not here.

## Run locally

Requirements: Node.js 20.9+ (Node 22 recommended) and a running Laravel CareerPrep API.

```bash
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL to your Laravel API (default http://localhost:8000)
npm run dev                     # http://localhost:3000
```

The public pages work without the API. The dashboard, sign-in and registration need it.

## Quality gate

```bash
npm run check    # tsc → eslint → vitest → next build (no database or API needed)
npm test         # unit tests that pin every request to the Laravel contract
LARAVEL_LIVE_URL=http://127.0.0.1:8000 npx vitest run tests/laravel-live.test.ts   # opt-in, against a running non-production API
```

## Deploying (manual only)

Automatic Git deployments are **off**: `vercel.json` sets `"git": { "deploymentEnabled": false }`, so pushes and pull
requests don't trigger Vercel builds on any branch that contains it. Deploy by hand with the Vercel CLI:

```bash
npx vercel login                       # once per machine
npx vercel link                        # once per checkout: pick the scope and project
npx vercel                             # Preview deployment
npx vercel --prod                      # Production deployment
```

The CLI uploads your local working tree, so deploy from a clean checkout of the commit you mean to ship. Set the
variables above in Vercel → Settings → Environment Variables (Node.js 22.x). The build runs no database step.
Laravel's CORS only allows `FRONTEND_URL`, so a Preview deployment can't call the API unless Laravel allows its origin.

## Where things live

| Path | Purpose |
|---|---|
| `src/config/site.ts` | Brand and business config. The review price is **not** here: it comes from Laravel `GET /pricing` (`src/lib/laravel/use-pricing.ts`) |
| `src/app/(site)` | Public pages (home, resume review, guides, jobs notice, employers, legal) |
| `src/app/(auth)` | Sign in and registration (Laravel) |
| `src/app/dashboard` | Candidate dashboard: resumes, payment callback, reviews, profile (Laravel) |
| `src/app/admin` | Admin area for staff with `role: admin` (Laravel Admin API; see `docs/BACKEND.md`) |
| `src/lib/laravel` | API client: the only place endpoint paths are defined |
| `src/lib/review-progress.ts` | Staged review-progress steps, tips and timing (used by Start review, payment callback and Retry) |
| `src/components/ui` | Design-system primitives; tokens live in `src/app/globals.css` (`@theme`) |
| `src/content/guides.ts` | Career guide content |
| `tests/` | Vitest: contract unit tests and the opt-in live API test |
