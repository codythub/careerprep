import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { sendEmail } from "@/server/email/send";
import { emails } from "@/server/email/templates";
import { notify } from "@/server/notifications";
import { publicJobWhere } from "@/server/services/jobs";

const DAY = 86_400_000;

/**
 * Daily reminders. Each uses a one-day window so a daily cron sends each reminder once:
 *  - saved jobs closing in 2–3 days
 *  - applications marked "Applied" exactly 14 days ago (follow-up nudge)
 */
export async function sendReminderEmails(now: Date = new Date()) {
  const saved = await db.savedJob.findMany({
    where: {
      job: { AND: [publicJobWhere(now), { closingDate: { gte: new Date(now.getTime() + 2 * DAY), lt: new Date(now.getTime() + 3 * DAY) } }] },
    },
    include: { user: { select: { id: true, email: true } }, job: { select: { title: true, slug: true, closingDate: true } } },
    take: 500,
  });
  for (const s of saved) {
    const url = `${env.siteUrl}/jobs/${s.job.slug}`;
    await notify(s.user.id, { type: "JOB_ALERT", title: "Saved job closing soon", body: `"${s.job.title}" closes on ${formatDate(s.job.closingDate)}.`, link: `/jobs/${s.job.slug}` });
    await sendEmail(s.user.email, emails.savedJobClosing(s.job.title, formatDate(s.job.closingDate), url));
  }

  const apps = await db.application.findMany({
    where: { status: "APPLIED", appliedAt: { gte: new Date(now.getTime() - 15 * DAY), lt: new Date(now.getTime() - 14 * DAY) } },
    include: { user: { select: { id: true, email: true } } },
    take: 500,
  });
  for (const a of apps) {
    await notify(a.user.id, { type: "JOB_ALERT", title: "Time to follow up?", body: `You applied to "${a.jobTitle}" two weeks ago.`, link: "/dashboard/applications" });
    await sendEmail(a.user.email, emails.applicationReminder(a.jobTitle, `${env.siteUrl}/dashboard/applications`));
  }
  return { savedJobReminders: saved.length, applicationReminders: apps.length };
}
