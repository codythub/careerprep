import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { db } from "@/lib/db";
import { REPORT_REASON_LABEL } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { OpButton } from "@/components/admin/admin-forms";
import { jobStatusAction, resolveReportAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Job Reports" };

export default async function ReportsPage() {
  await requireAdmin();
  const reports = await db.jobReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { job: { select: { id: true, title: true, companyName: true, status: true } }, user: { select: { email: true } } },
  });
  return (
    <>
      <PageHeader title="Job Reports" description="Reports from users about suspicious or incorrect listings." />
      {reports.length === 0 ? (
        <EmptyState icon={<Flag className="size-5" />} title="No reports" />
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.status === "OPEN" ? "danger" : "neutral"}>{r.status}</Badge>
                    <span className="font-medium">{REPORT_REASON_LABEL[r.reason]}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    <Link href={`/admin/jobs/${r.job.id}`} className="text-brand-700 hover:underline">{r.job.title}</Link>
                    <span className="text-slate-500"> · {r.job.companyName} · {r.job.status}</span>
                  </p>
                  {r.details && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{r.details}</p>}
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(r.createdAt)} · {r.user?.email ?? r.reporterEmail ?? "anonymous"}</p>
                </div>
                {r.status === "OPEN" && (
                  <div className="flex flex-wrap gap-2">
                    {r.job.status === "PUBLISHED" && (
                      <OpButton action={jobStatusAction} fields={{ jobId: r.job.id, op: "unpublish" }} variant="danger" confirm="Unpublish this job?">Unpublish job</OpButton>
                    )}
                    <OpButton action={resolveReportAction} fields={{ reportId: r.id, status: "ACTIONED" }}>Mark actioned</OpButton>
                    <OpButton action={resolveReportAction} fields={{ reportId: r.id, status: "DISMISSED" }} variant="ghost">Dismiss</OpButton>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
