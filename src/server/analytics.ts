import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AnalyticsEventName } from "@/lib/analytics-events";

/**
 * Replaceable analytics sink. Today events go to our own AnalyticsEvent table;
 * swap the body of this function to forward to PostHog/GA/etc. without touching callers.
 * Never throws — analytics must not break user flows.
 */
export async function track(
  name: AnalyticsEventName,
  data: { path?: string; userId?: string | null; jobId?: string | null; props?: Prisma.InputJsonObject } = {},
): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: { name, path: data.path, userId: data.userId ?? null, jobId: data.jobId ?? null, props: data.props },
    });
  } catch (err) {
    console.error("[analytics] failed to record", name, err);
  }
}
