# CareerPrep NG — frontend

**Prepare Better. Apply Smarter.** Automated, rule-based resume reviews paid through Paystack, plus career guides
for Nigerian professionals.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vercel. **Backend: the Laravel CareerPrep API** (`/api/v1`,
Sanctum bearer tokens, PostgreSQL, Paystack, private resume storage), which is a separate project.

> The brand is a placeholder. Change it in **`src/config/site.ts`** (name, tagline, domain, support email, social links)
> and the colour palette in `src/app/globals.css` (`--color-brand-*`).

## Architecture

This app has **no database, no Prisma, no server-side data access and no secrets**. Every piece of account data
comes from Laravel, called from the browser with the candidate's bearer token:

- `src/lib/laravel/`: the typed API client: config/endpoints, fetch wrapper, normalisers and token storage.
- `src/components/candidate/`: auth provider and `/dashboard` guard, forms, and the dashboard views.
- `src/content/guides.ts`: career guides (static content, prerendered).

See **[`docs/BACKEND.md`](docs/BACKEND.md)** for the feature → endpoint map, which workflows have been verified
against a running Laravel, and the backend contract that is still missing (admin, job board, employer submissions,
stories/testimonials). Those features have no Laravel endpoint yet, so they are not shown with fake data. `/jobs`
and `/success-stories` say so plainly, and `/employers/post-job` asks employers to email.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Laravel base URL, e.g. `https://api.example.com` (`/api/v1` is appended if missing). Also added to the CSP `connect-src`. |
| `NEXT_PUBLIC_SITE_URL` | Production | This site's public URL (canonical URLs, sitemap, Open Graph). Defaults to `http://localhost:3000`. |
| `SITE_NOINDEX` | No | `true` keeps a preview/temporary deployment out of search engines. |

`NEXT_PUBLIC_*` values are inlined at **build** time, so a change needs a new deploy. `DATABASE_URL`, `DIRECT_URL`,
`AUTH_SECRET`, Paystack, Supabase and Resend variables are **not** used by this app; remove them from Vercel.

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

## Deploying

The repo is connected to the Vercel project `careerprep-ng`: every push to `main` deploys to production
(https://careerprep-ng.vercel.app). Pushes to other branches get preview URLs, but Laravel's CORS only allows
`FRONTEND_URL`, so previews can't call the API unless Laravel allows their origin. Set the variables above in
Vercel → Settings → Environment Variables (Node.js 22.x). The build runs no database step.

## Where things live

| Path | Purpose |
|---|---|
| `src/config/site.ts` | Brand and business config, including the **display-only** review price (keep it in sync with Laravel `PAYSTACK_REVIEW_AMOUNT`) |
| `src/app/(site)` | Public pages (home, resume review, guides, jobs notice, employers, legal) |
| `src/app/(auth)` | Sign in and registration (Laravel) |
| `src/app/dashboard` | Candidate dashboard: resumes, payment callback, reviews, profile (Laravel) |
| `src/lib/laravel` | API client: the only place endpoint paths are defined |
| `src/content/guides.ts` | Career guide content |
| `tests/` | Vitest: contract unit tests and the opt-in live API test |

`docs/PLAN.md` is the original V1 plan, which used a Prisma backend. It is kept for its product rules only.
