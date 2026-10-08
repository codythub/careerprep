import type { Metadata } from "next";
import Link from "next/link";
import type { JobStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { EligibilityBadge, WorkModeBadge } from "@/components/jobs/job-badges";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Jobs" };
const PAGE = 25;
const STATUSES: JobStatus[] = ["DRAFT", "PUBLISHED", "EXPIRED", "PENDING_REVIEW", "REJECTED"];
const STATUS_TONE = { DRAFT: "neutral", PUBLISHED: "success", EXPIRED: "warning", PENDING_REVIEW: "info", REJECTED: "danger" } as const;

export default async function AdminJobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status as JobStatus) ? (sp.status as JobStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { companyName: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { category: { select: { name: true } }, _count: { select: { reports: { where: { status: "OPEN" } }, applyClicks: true } } },
    }),
  ]);
  return (
    <>
      <PageHeader title="Jobs" description={`${total} job${total === 1 ? "" : "s"}`} actions={<LinkButton href="/admin/jobs/new">New job</LinkButton>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
          <Link href="/admin/jobs" className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", !status ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>All</Link>
          {STATUSES.map((s) => (
            <Link key={s} href={`/admin/jobs?status=${s}`} className={cn("shrink-0 rounded-full border px-3 py-1 text-sm capitalize", status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>
              {s.replace("_", " ").toLowerCase()}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="jq" className="sr-only">Search jobs</label>
          <input id="jq" name="q" defaultValue={q} placeholder="Search title or company" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm sm:w-56" />
        </form>
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="No jobs found" action={<LinkButton href="/admin/jobs/new">Create a job</LinkButton>} />
      ) : (
        <TableWrap>
          <thead>
            <tr><th>Job</th><th>Status</th><th>Location</th><th>Category</th><th>Clicks</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link href={`/admin/jobs/${j.id}`} className="font-medium text-brand-700 hover:underline">{j.title}</Link>
                  <span className="block text-xs text-slate-500">{j.companyName}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {j.isDemo && <Badge tone="danger">Demo</Badge>}
                    {j.isFeatured && <Badge tone="brand">Featured</Badge>}
                    {j.isSponsored && <Badge tone="accent">Sponsored</Badge>}
                    {!j.companyVerified && <Badge tone="warning">Employer unverified</Badge>}
                    {j._count.reports > 0 && <Badge tone="danger">{j._count.reports} open reports</Badge>}
                  </span>
                </td>
                <td><Badge tone={STATUS_TONE[j.status]}>{j.status.replace("_", " ")}</Badge></td>
                <td><span className="flex flex-wrap gap-1"><WorkModeBadge mode={j.workMode} /><EligibilityBadge eligibility={j.nigeriaEligibility} /></span></td>
                <td>{j.category.name}</td>
                <td className="tabular-nums">{j._count.applyClicks}</td>
                <td className="whitespace-nowrap">{formatDate(j.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} basePath="/admin/jobs" params={{ status, q: q || undefined }} />
    </>
  );
}
