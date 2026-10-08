import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import type { SubmissionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/labels";
import { cn, formatDate } from "@/lib/format";
import { hostnameOf } from "@/lib/url";
import { Badge, Card, CardBody, DefinitionList, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/markdown";
import { SubmissionReviewForms } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Employer Submissions" };
const TABS: SubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default async function SubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = TABS.includes(sp.status as SubmissionStatus) ? (sp.status as SubmissionStatus) : "PENDING";
  const [subs, categories] = await Promise.all([
    db.employerSubmission.findMany({ where: { status }, orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" }, take: 50, include: { reviewedBy: { select: { email: true } } } }),
    db.jobCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Employer Submissions" description="Nothing is published automatically. Approving creates a draft job for final checks." />
      <nav className="mb-6 flex gap-2" aria-label="Submission status">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/submissions?status=${t}`} className={cn("rounded-full border px-3 py-1 text-sm capitalize", status === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>
            {t.toLowerCase()}
          </Link>
        ))}
      </nav>
      {subs.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title={`No ${status.toLowerCase()} submissions`} />
      ) : (
        <div className="space-y-6">
          {subs.map((s) => {
            const domainMismatch = !s.recruiterEmail.toLowerCase().endsWith(hostnameOf(s.companyWebsite).toLowerCase());
            return (
              <Card key={s.id}>
                <CardBody className="space-y-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{s.jobTitle}</h2>
                      <p className="text-sm text-slate-600">{s.companyName} · submitted {formatDate(s.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {domainMismatch && <Badge tone="warning">Email domain ≠ website</Badge>}
                      {s.status !== "PENDING" && <Badge>{s.status} {s.reviewedBy ? `by ${s.reviewedBy.email}` : ""}</Badge>}
                    </div>
                  </div>
                  <DefinitionList
                    items={[
                      ["Website", <a key="w" href={s.companyWebsite} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 underline">{hostnameOf(s.companyWebsite)}</a>],
                      ["Recruiter", `${s.recruiterName} · ${s.recruiterEmail}`],
                      ["Location", s.location],
                      ["Arrangement", WORK_MODE_LABEL[s.workMode]],
                      ["Type", EMPLOYMENT_TYPE_LABEL[s.employmentType]],
                      ["Level", s.experienceLevel ? EXPERIENCE_LEVEL_LABEL[s.experienceLevel] : "—"],
                      ["Salary", s.salary ?? "—"],
                      ["Closing", formatDate(s.closingDate)],
                      ["Apply URL", <a key="a" href={s.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-brand-700 underline">{s.applyUrl}</a>],
                    ]}
                  />
                  <details className="rounded-lg bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold">Description, responsibilities &amp; requirements</summary>
                    <Markdown className="mt-3 text-sm">{s.jobDescription}</Markdown>
                    {s.responsibilities && <Markdown className="mt-3 text-sm">{s.responsibilities}</Markdown>}
                    {s.requirements && <Markdown className="mt-3 text-sm">{s.requirements}</Markdown>}
                  </details>
                  {s.status === "PENDING" && <SubmissionReviewForms submissionId={s.id} categories={categories} />}
                  {s.status === "APPROVED" && s.jobId && (
                    <Link href={`/admin/jobs/${s.jobId}`} className="text-sm font-medium text-brand-700">Open draft job →</Link>
                  )}
                  {s.status === "REJECTED" && s.reviewNote && <p className="text-sm text-slate-600">Reason: {s.reviewNote}</p>}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
