import { db } from "@/lib/db";

export const RATE_LIMITS = {
  login: { limit: 10, windowSec: 15 * 60 },
  register: { limit: 5, windowSec: 60 * 60 },
  passwordReset: { limit: 5, windowSec: 60 * 60 },
  employerSubmission: { limit: 5, windowSec: 60 * 60 },
  jobReport: { limit: 10, windowSec: 60 * 60 },
  paymentInit: { limit: 10, windowSec: 15 * 60 },
  upload: { limit: 20, windowSec: 60 * 60 },
  testimonial: { limit: 5, windowSec: 60 * 60 },
  events: { limit: 120, windowSec: 60 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

/**
 * Fixed-window counter stored in Postgres. One atomic upsert per call, so it is
 * safe across concurrent serverless instances. Returns true when allowed.
 */
export async function rateLimit(bucket: RateLimitBucket, identifier: string): Promise<boolean> {
  const { limit, windowSec } = RATE_LIMITS[bucket];
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSec * 1000)) * windowSec * 1000;
  const key = `${bucket}:${identifier.toLowerCase()}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowSec * 1000);

  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;
  return (rows[0]?.count ?? 1) <= limit;
}

export async function purgeExpiredRateLimits(): Promise<number> {
  const { count } = await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return count;
}
