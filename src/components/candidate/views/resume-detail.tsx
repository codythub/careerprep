"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { getPendingPayment } from "@/lib/laravel/token";
import { LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, PageHeader } from "@/components/ui/primitives";
import { DeleteResumeButton, PayForReviewButton } from "@/components/candidate/actions";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { useApi } from "@/components/candidate/auth";
import { Loading } from "@/components/candidate/views/loading";

export function ResumeDetailView({ id }: { id: string }) {
  const resume = useApi((t) => api.getResume(t, id), [id]);
  // Laravel has no per-resume review filter in the contract: show matches from the latest page of reviews.
  const reviews = useApi((t) => api.listReviews(t), []);
  const forThis = (reviews.data?.items ?? []).filter((r) => r.resumeId === id);

  // A checkout started for this resume whose payment hasn't been verified/used yet (client storage).
  const [hasPending, setHasPending] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHasPending(String(getPendingPayment()?.resumeId ?? "") === id), 0);
    return () => clearTimeout(t);
  }, [id]);

  const back = (
    <Link href="/dashboard/resumes" className="text-sm text-slate-500 hover:text-slate-900">← My resumes</Link>
  );

  if (resume.loading) return <>{back}<Loading /></>;
  if (!resume.data) {
    return (
      <>
        {back}
        <Alert tone="error" title={resume.status === 404 ? "Resume not found" : "We couldn't load this resume"} className="mt-4">
          {resume.status === 404 ? "This resume doesn't exist or was deleted." : resume.error}
        </Alert>
      </>
    );
  }
  const r = resume.data;

  return (
    <>
      {back}
      <PageHeader title={r.fileName} description="PDF resume" actions={<DeleteResumeButton resumeId={r.id} redirectTo="/dashboard/resumes" />} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-t-4 border-t-emerald-500">
            <CardBody>
              <h2 className="text-lg font-semibold">Get an automated assessment</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pay securely with Paystack. Once CareerPrep confirms your payment, you can run one review of this resume and see
                your overall score, category scores, weaknesses and recommendations.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PayForReviewButton resumeId={r.id} />
              </div>
              {hasPending && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-600">Already paid for this resume and didn&apos;t start the review?</p>
                  <div className="mt-2">
                    <LinkButton href="/dashboard/payments/callback" variant="outline">
                      Confirm my payment
                    </LinkButton>
                  </div>
                </div>
              )}
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="size-3.5" aria-hidden /> Payments are verified by CareerPrep&apos;s servers — never by your browser.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="font-semibold">Reviews of this resume</h2>
              {reviews.loading ? (
                <Loading />
              ) : reviews.error ? (
                <Alert tone="error" className="mt-3">{reviews.error}</Alert>
              ) : forThis.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">No reviews yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
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
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardBody>
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <FileText className="size-5" aria-hidden />
            </div>
            <DefinitionList
              items={[
                ["File name", r.fileName],
                ["Size", r.sizeBytes !== null ? formatBytes(r.sizeBytes) : "—"],
                ["Type", r.mimeType ?? "—"],
                ["Uploaded", formatDate(r.uploadedAt)],
                ...(r.status ? ([["Status", r.status]] as Array<[string, string]>) : []),
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
