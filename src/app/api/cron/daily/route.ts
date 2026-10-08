import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireClosedJobs } from "@/server/services/jobs";
import { purgeExpiredRateLimits } from "@/server/rate-limit";
import { sendReminderEmails } from "@/server/services/reminders";

/** Daily maintenance (Vercel Cron). Protected by CRON_SECRET bearer token. */
export async function GET(request: Request) {
  const secret = env.cronSecret;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireClosedJobs();
  const purged = await purgeExpiredRateLimits();
  const reminders = await sendReminderEmails();
  return NextResponse.json({ expiredJobs: expired, purgedRateLimits: purged, ...reminders });
}
