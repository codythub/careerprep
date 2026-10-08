import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CLIENT_EVENTS, isAnalyticsEvent } from "@/lib/analytics-events";
import { clientIpFromHeaders } from "@/server/request";
import { rateLimit } from "@/server/rate-limit";
import { track } from "@/server/analytics";

const bodySchema = z.object({
  name: z.string().max(40),
  path: z.string().max(300).optional(),
  props: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

/** Browser analytics beacon. Only allow-listed, low-risk client events are accepted. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isAnalyticsEvent(parsed.data.name) || !CLIENT_EVENTS.includes(parsed.data.name)) {
    return new NextResponse(null, { status: 204 });
  }
  if (!(await rateLimit("events", clientIpFromHeaders(request.headers)))) return new NextResponse(null, { status: 204 });
  const session = await auth();
  await track(parsed.data.name, { path: parsed.data.path, userId: session?.user?.id, props: parsed.data.props });
  return new NextResponse(null, { status: 204 });
}
