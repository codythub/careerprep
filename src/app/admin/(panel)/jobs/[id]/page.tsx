import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { REPORT_REASON_LABEL } from "@/lib/labels";
import { Alert, Badge, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { JobForm, OpButton } from "@/components/admin/admin-forms";
import { jobStatusAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage({ params, searchParams }: PageProps<"/admin/jobs/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [job, categories, views] = await Promise.all([
    db.job.findUnique({
      where: { id },
      include: {
        submission: true,
        reports: { orderBy: { createdAt: "desc" }, take: 10 },
        verifiedBy: { select: { email: true } },
        _count: { select: { applyClicks: true, savedBy: true } },
      },
    }),
    db.jobCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.analyticsEvent.count({ where: { name: "job_view", jobId: id } }),
  ]);
  if (!job) notFound();

  return (
    <>
      <Link href="/admin/jobs" className="text-sm text-slate-500 hover:text-slate-900">← Jobs</Link>
      <PageHeader
        title={job.title}
        description={`${job.companyName} · ${job.status}${job.postedAt ? ` · posted ${formatDate(job.postedAt)}` : ""}`}
        actions={
          <>
            {job.status === "PUBLISHED" && (
              <Link href={`/jobs/${job.slug}`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">
                View live
              </Link>
            )}
            {job.status !== "PUBLISHED" && <OpButton action={jobStatusAction} fields={{ jobId: job.id, op: "publish" }} variant="primary">Publish</OpButton>}
            {job.status === "PUBLISHED" && <OpButton action={jobStatusAction} fields={{ jobId: job.id, op: "unpublish" }}>Unpublish</OpButton>}
            {job.status !== "EXPIRED" && <OpButton action={jobStatusAction} fields={{ jobId: job.id, op: "expire" }}>Expire</OpButton>}
            <OpButton action={jobStatusAction} fields={{ jobId: job.id, op: "feature" }}>{job.isFeatured ? "Unfeature" : "Feature"}</OpButton>
            <OpButton action={jobStatusAction} fields={{ jobId: job.id, op: "delete" }} variant="danger" confirm="Permanently delete this job?">Delete</OpButton>
          </>
        }
      />

      {sp.created === "1" && <Alert tone="success" className="mb-4">Draft job created. Review it, then publish when ready.</Alert>}
      {sp.fromSubmission === "1" && (
        <Alert tone="info" className="mb-4">
          Draft created from an employer submission. Confirm the category, experience level, Nigeria eligibility and employer verification before publishing.
        </Alert>
      )}
      {job.isDemo && <Alert tone="error" className="mb-4">This is a DEMO listing seeded for development. Delete it before launch.</Alert>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardBody className="p-4"><p className="text-xs text-slate-500">Views</p><p className="text-xl font-semibold">{views}</p></CardBody></Card>
        <Card><CardBody className="p-4"><p className="text-xs text-slate-500">Apply clicks</p><p className="text-xl font-semibold">{job._count.applyClicks}</p></CardBody></Card>
        <Card><CardBody className="p-4"><p className="text-xs text-slate-500">Saved</p><p className="text-xl font-semibold">{job._count.savedBy}</p></CardBody></Card>
        <Card><CardBody className="p-4"><p className="text-xs text-slate-500">Eligibility verified</p><p className="truncate text-sm font-semibold">{job.verifiedAt ? `${formatDate(job.verifiedAt)} · ${job.verifiedBy?.email ?? ""}` : "—"}</p></CardBody></Card>
      </div>

      {job.reports.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardBody>
            <h2 className="font-semibold">Reports</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {job.reports.map((r) => (
                <li key={r.id}>
                  <Badge tone={r.status === "OPEN" ? "danger" : "neutral"}>{r.status}</Badge> {REPORT_REASON_LABEL[r.reason]}
                  {r.details && <span className="text-slate-600"> — {r.details}</span>}
                  <span className="block text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
                </li>
              ))}
            </ul>
            <Link href="/admin/reports" className="mt-2 inline-block text-sm font-medium text-brand-700">Manage reports →</Link>
          </CardBody>
        </Card>
      )}

      {job.submission && (
        <Card className="mb-6">
          <CardBody className="text-sm">
            <h2 className="font-semibold">Employer submission</h2>
            <p className="mt-1 text-slate-600">
              {job.submission.recruiterName} · {job.submission.recruiterEmail} · submitted {formatDate(job.submission.createdAt)}
              {job.submission.salary && ` · salary: ${job.submission.salary}`}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <JobForm
            categories={categories}
            job={{
              ...job,
              closingDate: job.closingDate ? job.closingDate.toISOString().slice(0, 10) : null,
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}
