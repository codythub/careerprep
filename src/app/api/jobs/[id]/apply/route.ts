import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordApplyClick } from "@/server/services/jobs";

/**
 * Logs an outbound application click, then sends the user to the employer's own
 * application URL (validated as a public http(s) URL on save). The destination is
 * shown on the button before clicking, so nothing is disguised.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/jobs/[id]/apply">) {
  const { id } = await ctx.params;
  const session = await auth();
  const url = await recordApplyClick(id, session?.user?.id ?? null);
  if (!url) return NextResponse.redirect(new URL("/jobs", request.url), 303);
  return NextResponse.redirect(url, 302);
}
