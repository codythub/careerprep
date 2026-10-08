# CareerPrep NG — Nigerian Career & Remote Job Platform

**Prepare Better. Apply Smarter.** Resume optimization (₦6,000), a reviewed remote job board with honest Nigeria-eligibility labels, employer job submissions and career guides.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 6 · Auth.js v5 · Paystack · Supabase Storage · Resend · Vercel.

> The brand is a placeholder. Change it in **`src/config/site.ts`** (name, tagline, domain, support email, social links) and the colour palette in `src/app/globals.css` (`--color-brand-*`).

## Backend: Laravel CareerPrep API (authoritative)

Candidate features — registration, login/logout, profile, PDF resumes, Paystack payments, automated
reviews and review history — are served by the separate **Laravel CareerPrep API** (`/api/v1`, Sanctum
bearer tokens). This Next.js app is its client:

- `NEXT_PUBLIC_API_URL` — Laravel base URL (`/api/v1` is appended if missing).
- `src/lib/laravel/config.ts` — **every endpoint path** and the upload field name (edit here if Laravel's routes differ).
- `src/lib/laravel/types.ts` — response normalisers (rename only; never invent data).
- `src/lib/laravel/client.ts` / `api.ts` — browser client. Sends `Authorization: Bearer <token>` with `credentials: "omit"` (the API has `supports_credentials=false`; no cookies, no Next.js proxy).
- `src/lib/laravel/token.ts` — the token from `POST /auth/login|register` (`{ data: User, token }`) is kept in `localStorage`; so is the pending Laravel payment ID, which `POST /payments/{payment}/verify` needs after Paystack redirects back.
- `src/components/candidate/auth.tsx` — client auth provider and `/dashboard` guard (validates the token with `GET /auth/user`; a 401 clears it and sends the user to `/login`).
- Candidate UI: `src/app/dashboard/*`, `src/app/(auth)/*`, `src/components/candidate/*`.

Laravel must allow this site's origin in CORS (with the `Authorization` header, and expose `Content-Disposition`
for report downloads), and send Paystack back to `<site>/dashboard/payments/callback`.

The Prisma/Next.js backend remains only for the **legacy** public content (jobs, guides, stories)
and the legacy admin panel (`/admin`, sign in at `/admin/login`).

## Deploying

The repo is connected to the Vercel project `careerprep-ng`: every push to `main` deploys to production
(https://careerprep-ng.vercel.app); pushes to other branches get preview URLs. Environment variables
(e.g. `NEXT_PUBLIC_API_URL`) live in Vercel and are not in this repo — changing one needs a new deploy.

## Run locally

Requirements: Node.js 20.9+ (Node 22 recommended). No Docker or Postgres install is needed.

```bash
npm install
cp .env.example .env            # then set AUTH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npm run db:local                # terminal 1: embedded PostgreSQL on port 54329
npx prisma migrate deploy       # terminal 2: apply migrations
npm run db:seed                 # categories, admin, settings, DEMO jobs, starter guides
npm run dev                     # http://localhost:3000
```

Without Paystack, Supabase or Resend keys the app still runs:
- **Emails** are printed to the server console.
- **Files** use a local, HMAC-signed store in `.local-storage/`.
- **Checkout** shows a "payments not configured" notice.

The local storage driver is refused under `NODE_ENV=production` unless `ALLOW_LOCAL_STORAGE=true` is set, so production must use Supabase.

## Quality gate

```bash
npm run check    # prisma validate → tsc → eslint → vitest → next build
npm test         # 69 integration tests against a throwaway embedded Postgres
```

## Deploy (Vercel + Supabase)

1. **Supabase:**
   - Create a project.
   - Create buckets **`resumes` (private)** and **`media` (public)**.
   - Copy the pooled connection string (`DATABASE_URL`, add `?pgbouncer=true&connection_limit=1`) and the direct connection string (`DIRECT_URL`).
2. **Paystack:** copy the secret key and set the webhook URL to `https://<domain>/api/paystack/webhook`.
3. **Resend:** verify your sending domain and set `EMAIL_FROM`.
4. **Vercel:** import the project and add every variable from `.env.example` in Settings → Environment Variables. Set the Node.js version to 22.x.
5. **Migrate and seed** the production database once, from your machine with the production env:
   ```bash
   npx prisma migrate deploy
   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed   # no demo jobs in production
   ```
6. **Deploy:** `npx vercel --prod`. `vercel.json` schedules the daily cron (`/api/cron/daily`), which expires closed jobs, sends reminders and purges rate-limit rows.

## Where things live

| Path | Purpose |
|---|---|
| `src/config/site.ts` | Brand + business config (single source) |
| `src/app/(site)` | Public pages (home, jobs, guides, stories, employers, legal) |
| `src/app/dashboard`, `src/app/admin` | User dashboard and admin area |
| `src/app/api` | Auth, Paystack webhook/callback, file gateway, apply redirect, events, cron |
| `src/server/services` | Business logic (orders, payments, jobs, social proof, articles…) |
| `src/server/actions` | Server actions (thin: validate → authorize → service) |
| `src/lib/validation.ts` | All Zod schemas |
| `prisma/` | Schema, migrations, seed |
| `tests/` | Vitest integration tests |

See `docs/PLAN.md` for the architecture and the decision log.
