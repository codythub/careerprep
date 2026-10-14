"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, PlusCircle, RotateCcw } from "lucide-react";
import { adminApi, type AdminReview } from "@/lib/laravel/admin";
import { formatDateTime } from "@/lib/format";
import { REVIEW_PROGRESS } from "@/lib/review-progress";
import { Button } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, PageHeader, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { BreakableText } from "@/components/ui/breakable";
import { useApi } from "@/components/candidate/auth";
import { ReviewResults, ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { ReviewProgress } from "@/components/candidate/review-progress";
import { useStagedProgress } from "@/components/candidate/use-staged-progress";
import { ListSkeleton } from "@/components/candidate/views/loading";
import { useAdminRunner } from "@/components/admin/admin-shell";
import { ConfirmAction, DataList, FilterBar, PaymentStatusBadge, UserCell, useListQuery } from "@/components/admin/ui";

export function AdminReviewsView() {
  const { filters, page, key } = useListQuery(["status", "user_id", "resume_id"]);
  const reviews = useApi((t) => adminApi.reviews(t, { ...filters, page }), [key]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Reviews" description={reviews.data ? `${reviews.data.total} reviews` : "Automated resume assessments."} />
      <FilterBar
        fields={[
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "pending", label: "Processing" },
            ],
          },
        ]}
      />
      {(filters.user_id || filters.resume_id) && (
        <p className="mb-4 text-sm text-slate-600">
          Filtered to {filters.user_id ? `user ${filters.user_id}` : `resume ${filters.resume_id}`}.{" "}
          <Link href="/admin/reviews" className="font-medium text-brand-700 underline underline-offset-2">
            Show all
          </Link>
        </p>
      )}
      {reviews.loading ? (
        <ListSkeleton label="Loading reviews…" />
      ) : reviews.error ? (
        <Alert tone="error" title="We couldn't load reviews" action={<Button variant="outline" size="sm" onClick={reviews.reload}>Try again</Button>}>
          {reviews.error}
        </Alert>
      ) : (
        <>
          <DataList
            rows={reviews.data!.items}
            href={(r) => `/admin/reviews/${r.id}`}
            empty={{ title: "No reviews found", body: "Try a different status.", icon: <ClipboardList /> }}
            columns={[
              { header: "Resume", cell: (r) => <span className="block max-w-64 truncate font-medium text-slate-900">{r.resumeName ?? `Review ${r.id}`}</span> },
              { header: "Candidate", cell: (r) => <UserCell user={r.user} id={r.userId} />, className: "max-w-56" },
              { header: "Score", cell: (r) => (r.status === "completed" ? <ScorePill score={r.overallScore} max={r.overallMax} /> : <span className="text-slate-400">—</span>) },
              { header: "Status", cell: (r) => <ReviewStatusBadge status={r.status} /> },
              { header: "Attempts", cell: (r) => (r.attempts !== null && r.maxAttempts !== null ? `${r.attempts}/${r.maxAttempts}` : "—"), className: "tabular-nums" },
              { header: "Created", cell: (r) => formatDateTime(r.createdAt), className: "whitespace-nowrap text-slate-600" },
            ]}
            card={(r) => (
              <>
                <p className="truncate font-medium text-slate-900">{r.resumeName ?? `Review ${r.id}`}</p>
                <p className="truncate text-xs text-slate-500">{r.user?.name ?? r.user?.email ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ReviewStatusBadge status={r.status} />
                  {r.status === "completed" && <ScorePill score={r.overallScore} max={r.overallMax} />}
                  <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
                </div>
              </>
            )}
          />
          <Pagination page={reviews.data!.currentPage} pageCount={reviews.data!.lastPage} basePath="/admin/reviews" params={filters} />
        </>
      )}
    </>
  );
}

const Back = () => (
  <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> Reviews
  </Link>
);

export function AdminReviewDetailView({ id }: { id: string }) {
  const loaded = useApi((t) => adminApi.review(t, id), [id]);
  const run = useAdminRunner();
  const [updated, setUpdated] = useState<AdminReview | null>(null);
  const r = updated ?? loaded.data;

  if (loaded.loading && !r) return (<><Back /><Skeleton className="mt-6 h-64" /></>);
  if (!r) {
    return (
      <>
        <Back />
        <Alert tone="error" title={loaded.status === 404 ? "Review not found" : "We couldn't load this review"} className="mt-6">
          {loaded.status === 404 ? "This review doesn't exist." : loaded.error}
        </Alert>
      </>
    );
  }
  const completed = r.status === "completed";

  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader
          eyebrow="Review"
          title={r.resumeName ? <BreakableText text={r.resumeName} /> : `Review ${r.id}`}
          description={
            <span className="flex flex-wrap items-center gap-2">
              <ReviewStatusBadge status={r.status} />
              <span>{formatDateTime(r.completedAt ?? r.createdAt)}</span>
            </span>
          }
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardBody>
            <DefinitionList
              items={[
                ["Candidate", <UserCell key="u" user={r.user} id={r.userId} />],
                ["Attempts", r.attempts !== null && r.maxAttempts !== null ? `${r.attempts} of ${r.maxAttempts}` : "—"],
                ["Extra attempts granted", r.extraAttempts ?? 0],
                ["Candidate can retry", r.canRetry ? "Yes" : "No"],
                ["Payment", r.paymentId ? <Link key="p" href={`/admin/payments/${r.paymentId}`} className="inline-flex items-center gap-2 text-brand-700 hover:underline">Payment {r.paymentId} <PaymentStatusBadge status={r.paymentStatus} /></Link> : "—"],
                ["Resume", r.resumeId ? <Link key="res" href={`/admin/resumes/${r.resumeId}`} className="text-brand-700 hover:underline">Resume {r.resumeId}</Link> : "—"],
                ...(r.failureReason ? ([["Failure reason", r.failureReason]] as Array<[string, string]>) : []),
              ]}
            />
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardBody className="space-y-4">
            <h2 className="font-semibold">Support actions</h2>
            {completed ? (
              <p className="text-sm text-slate-600">This review is completed. Retrying and granting attempts are only available for reviews that didn&apos;t finish.</p>
            ) : (
              <>
                <AdminRetry review={r} onDone={setUpdated} />
                <ConfirmAction
                  label="Grant an extra attempt"
                  icon={<PlusCircle className="size-4" aria-hidden />}
                  title="Give the candidate one more attempt?"
                  description="Raises this review's attempt limit by one so the candidate can retry it themselves. Recorded in the audit log."
                  confirmLabel="Grant attempt"
                  onConfirm={async () => setUpdated(await run((t) => adminApi.grantAttempt(t, r.id), "review"))}
                />
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {completed && <ReviewResults review={r} />}
    </>
  );
}

/** Admin retry (support override) with the same staged progress candidates see; optional resume switch. */
function AdminRetry({ review, onDone }: { review: AdminReview; onDone: (r: AdminReview) => void }) {
  const run = useAdminRunner();
  const progress = useStagedProgress(REVIEW_PROGRESS);
  const [confirming, setConfirming] = useState(false);
  const [resumeId, setResumeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resumes = useApi((t) => (review.userId ? adminApi.resumes(t, { user_id: review.userId }) : Promise.resolve(null)), [review.userId]);
  const options = (resumes.data?.items ?? []).filter((x) => x.id !== review.resumeId && x.extractionStatus === "succeeded");

  async function retry() {
    setError(null);
    try {
      const result = await progress.run(() => run((t) => adminApi.retryReview(t, review.id, resumeId || undefined), "resume_id"));
      if (!result) return;
      onDone(result);
      progress.reset();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The retry failed.");
    }
  }

  if (progress.busy || progress.phase === "done") return <ReviewProgress progress={progress} title="Retrying the review" embedded />;
  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)} className="w-full sm:w-auto">
        <RotateCcw className="size-4" aria-hidden /> Retry review
      </Button>
    );
  }
  return (
    <div className="animate-fade-up space-y-4 rounded-xl border border-line-strong p-4">
      <div>
        <p className="font-semibold text-slate-950">Retry this review now?</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Reprocesses the review even if the candidate has no attempts left (support override). It adds one to the attempt count and is
          recorded in the audit log.
        </p>
      </div>
      {options.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="admin-retry-resume" className="block text-sm font-medium text-slate-800">
            Resume
          </label>
          <select
            id="admin-retry-resume"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="block w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base shadow-xs focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus:outline-none sm:text-sm"
          >
            <option value="">Same resume{review.resumeName ? ` (${review.resumeName})` : ""}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fileName}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button onClick={() => void retry()}>Retry now</Button>
      </div>
    </div>
  );
}
