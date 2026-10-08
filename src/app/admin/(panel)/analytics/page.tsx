import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { daysAgo } from "@/lib/format";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { Card, CardBody, PageHeader, StatCard, TableWrap } from "@/components/ui/primitives";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Analytics" };

const LABEL: Record<string, string> = {
  homepage_view: "Homepage views",
  resume_cta_click: "Resume CTA clicks",
  resume_checkout_started: "Checkouts started",
  resume_payment_successful: "Successful payments",
  job_view: "Job views",
  job_search: "Job searches",
  job_filter: "Job filter uses",
  job_apply_click: "Apply clicks",
  job_saved: "Jobs saved",
  employer_submission: "Employer submissions",
  testimonial_submission: "Testimonial submissions",
};

export default async function AnalyticsPage() {
  await requireAdmin();
  const since = daysAgo(30);
  const [counts, topJobs] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.analyticsEvent.groupBy({
      by: ["jobId"],
      where: { name: "job_view", createdAt: { gte: since }, jobId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { jobId: "desc" } },
      take: 10,
    }),
  ]);
  const byName = Object.fromEntries(counts.map((c) => [c.name, c._count._all]));
  const jobs = await db.job.findMany({ where: { id: { in: topJobs.map((t) => t.jobId!) } }, select: { id: true, title: true, companyName: true } });
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const ctaClicks = byName.resume_cta_click ?? 0;
  const checkouts = byName.resume_checkout_started ?? 0;
  const paid = byName.resume_payment_successful ?? 0;

  return (
    <>
      <PageHeader title="Analytics" description="First-party events from the last 30 days." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ANALYTICS_EVENTS.map((e, i) => (
          <StatCard key={e} accentIndex={i} label={LABEL[e] ?? e} value={(byName[e] ?? 0).toLocaleString()} />
        ))}
      </div>
      <Card className="mt-6">
        <CardBody>
          <h2 className="font-semibold">Resume funnel (30 days)</h2>
          <p className="mt-2 text-sm text-slate-600">
            CTA clicks {ctaClicks} → checkouts started {checkouts} → paid {paid}
            {checkouts > 0 && ` (${Math.round((paid / checkouts) * 100)}% checkout completion)`}
          </p>
        </CardBody>
      </Card>
      <h2 className="mt-8 mb-3 font-semibold">Most viewed jobs (30 days)</h2>
      {topJobs.length === 0 ? (
        <p className="text-sm text-slate-600">No job views recorded yet.</p>
      ) : (
        <TableWrap>
          <thead><tr><th>Job</th><th>Views</th></tr></thead>
          <tbody>
            {topJobs.map((t) => {
              const j = jobMap.get(t.jobId!);
              return (
                <tr key={t.jobId}>
                  <td>{j ? <Link href={`/admin/jobs/${j.id}`} className="text-brand-700 hover:underline">{j.title} · {j.companyName}</Link> : "Deleted job"}</td>
                  <td className="tabular-nums">{t._count._all}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
