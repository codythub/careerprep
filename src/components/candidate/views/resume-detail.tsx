"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList, FileText, ScanLine, ShieldCheck } from "lucide-react";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import type { ExtractionStatus, Payment } from "@/lib/laravel/types";
import { usePricing } from "@/lib/laravel/use-pricing";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, IconTile, PageHeader, Skeleton } from "@/components/ui/primitives";
import { DeleteResumeButton, PayForReviewButton, StartReviewButton } from "@/components/candidate/actions";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { useApi } from "@/components/candidate/auth";
import { ExtractionBadge } from "@/components/candidate/views/resumes";
import { ListSkeleton } from "@/components/candidate/views/loading";

const EXTRACTION_LABEL: Record<ExtractionStatus, string> = { pending: "Pending", succeeded: "Readable", failed: "Couldn't be read" };

/** GET /payments has no resume filter, so walk the candidate's (newest-first) pages for this resume. */
async function paymentsForResume(token: string, resumeId: string): Promise<Payment[]> {
  const out: Payment[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await api.listPayments(token, page);
    out.push(...res.items.filter((p) => p.resumeId === resumeId));
    if (page >= res.lastPage) break;
  }
  return out;
}

const Back = () => (
  <Link href="/dashboard/resumes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> My resumes
  </Link>
);

export function ResumeDetailView({ id }: { id: string }) {
  const resume = useApi((t) => api.getResume(t, id), [id]);
  const reviews = useApi((t) => api.listReviews(t, 1, id), [id]);
  const forThis = reviews.data?.items ?? [];
  const payments = useApi((t) => paymentsForResume(t, id), [id]);
  const pricing = usePricing();
  // A verified payment whose one review hasn't been started yet.
  const unused = payments.data?.find((p) => p.entitlementStatus === "available") ?? null;
  // A checkout that was started but never verified (e.g. the candidate closed the tab after paying).
  const unconfirmed = payments.data?.find((p) => p.status === "initialized" && p.reference) ?? null;

  if (resume.loading) {
    return (
      <>
        <Back />
        <div className="mt-6 space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-2/3 sm:w-1/3" />
          <Skeleton className="h-48" />
          <span className="sr-only" role="status">
            Loading resume…
          </span>
        </div>
      </>
    );
  }
  if (!resume.data) {
    return (
      <>
        <Back />
        <Alert
          tone="error"
          title={resume.status === 404 ? "Resume not found" : "We couldn't load this resume"}
          className="mt-6"
          action={resume.status === 404 ? undefined : <Button variant="outline" size="sm" onClick={resume.reload}>Try again</Button>}
        >
          {resume.status === 404 ? "This resume doesn't exist or was deleted." : resume.error}
        </Alert>
      </>
    );
  }
  const r = resume.data;

  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader
          eyebrow="Resume"
          title={r.fileName}
          description={
            <span className="flex flex-wrap items-center gap-2">
              <ExtractionBadge status={r.extractionStatus} />
              <span>Uploaded {formatDate(r.uploadedAt)}</span>
            </span>
          }
          actions={<DeleteResumeButton resumeId={r.id} redirectTo="/dashboard/resumes" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-1 bg-brand-600" aria-hidden />
            <CardBody>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-lg font-semibold">Get an automated assessment</h2>
                {pricing.status === "ready" && pricing.label && (
                  <p className="text-2xl font-semibold tabular-nums text-slate-950">
                    {pricing.label}
                    <span className="ml-1 text-sm font-normal text-slate-500">one-time</span>
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Pay securely with Paystack. Once CareerPrep confirms your payment, you can run one review of this resume and see your
                overall score, category scores, weaknesses and recommendations.
              </p>

              <div className="mt-5">
                {payments.loading ? (
                  <Skeleton className="h-12 w-full sm:w-64" />
                ) : unused ? (
                  <div className="space-y-4">
                    <Alert tone="success" title="You have a paid review ready">
                      Your payment{unused.reference ? ` (${unused.reference})` : ""} was verified. Start the review whenever you&apos;re ready.
                    </Alert>
                    <StartReviewButton paymentId={unused.id} embedded />
                  </div>
                ) : r.extractionStatus === "failed" ? (
                  <Alert tone="warning" title="We couldn't read the text in this PDF">
                    <p>{r.extractionError ?? "The assessment needs selectable text."}</p>
                    <p className="mt-2 flex items-start gap-2">
                      <ScanLine className="mt-0.5 size-4 shrink-0" aria-hidden />
                      A review of this file would fail, so payment is turned off for it. Export your resume from Word or Google Docs as a
                      PDF and upload that instead.
                    </p>
                    <LinkButton href="/dashboard/resumes" variant="outline" size="sm" className="mt-3">
                      Upload a new PDF
                    </LinkButton>
                  </Alert>
                ) : (
                  <PayForReviewButton resumeId={r.id} />
                )}
              </div>
              {payments.error && (
                <Alert tone="error" className="mt-4">
                  {payments.error}
                </Alert>
              )}
              {!unused && unconfirmed?.reference && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-700">Already paid for this resume and didn&apos;t start the review?</p>
                  <LinkButton href={`/dashboard/payments/callback?reference=${encodeURIComponent(unconfirmed.reference)}`} variant="outline" size="sm">
                    Confirm my payment
                  </LinkButton>
                </div>
              )}
              <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden /> Payments are verified by CareerPrep&apos;s servers with Paystack — never by
                your browser.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="font-semibold">Reviews of this resume</h2>
              <div className="mt-4">
                {reviews.loading ? (
                  <ListSkeleton rows={2} label="Loading reviews…" />
                ) : reviews.error ? (
                  <Alert tone="error">{reviews.error}</Alert>
                ) : forThis.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl bg-surface p-4 text-sm text-slate-600">
                    <ClipboardList className="size-5 shrink-0 text-slate-400" aria-hidden /> No reviews yet. Your results will appear here.
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {forThis.map((rv) => (
                      <li key={rv.id}>
                        <Link href={`/dashboard/reviews/${rv.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-700">
                          <span className="text-sm">{formatDateTime(rv.createdAt)}</span>
                          <span className="flex items-center gap-2">
                            <ReviewStatusBadge status={rv.status} />
                            {rv.status === "completed" && <ScorePill score={rv.overallScore} max={rv.overallMax} />}
                            <ArrowRight className="size-4 text-slate-400" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardBody>
            <IconTile className="mb-5">
              <FileText />
            </IconTile>
            <DefinitionList
              items={[
                ["File name", r.fileName],
                ["Size", r.sizeBytes !== null ? formatBytes(r.sizeBytes) : "—"],
                ["Type", r.mimeType ?? "—"],
                ["Uploaded", formatDate(r.uploadedAt)],
                ...(r.extractionStatus ? ([["Text extraction", EXTRACTION_LABEL[r.extractionStatus]]] as Array<[string, string]>) : []),
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
