"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Download, LifeBuoy, Loader2, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import type { Review } from "@/lib/laravel/types";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, PageHeader, Skeleton } from "@/components/ui/primitives";
import { BreakableText } from "@/components/ui/breakable";
import { AutoRefresh, RetryReviewButton } from "@/components/candidate/actions";
import { HeuristicDisclaimer, ReviewResults, ReviewStatusBadge } from "@/components/candidate/review-view";
import { useApi, useCandidateAuth } from "@/components/candidate/auth";

/** GET /reviews/{review}/download with the bearer token, saved via a temporary object URL. */
function DownloadReportButton({ reviewId }: { reviewId: string }) {
  const { state, handleUnauthorized } = useCandidateAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (state.status !== "authenticated") return handleUnauthorized();
    setBusy(true);
    setError(null);
    try {
      const { blob, fileName } = await api.downloadReview(state.token, reviewId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
      setError(err instanceof ApiError ? err.message : "Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-start sm:items-end">
      <Button variant="outline" onClick={() => void download()} loading={busy}>
        {!busy && <Download className="size-4" aria-hidden />}
        {busy ? "Preparing…" : "Download report"}
      </Button>
      {error && (
        <span role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}

const Back = () => (
  <Link href="/dashboard/reviews" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> Review history
  </Link>
);

export function ReviewDetailView({ id }: { id: string }) {
  const review = useApi((t) => api.getReview(t, id), [id]);
  // A successful retry replaces the loaded review in place.
  const [retried, setRetried] = useState<Review | null>(null);
  const rv = retried?.id === id ? retried : review.data;

  if (review.loading && !rv) {
    return (
      <>
        <Back />
        <div className="mt-6 space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-2/3 sm:w-1/3" />
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <span className="sr-only" role="status">
            Loading review…
          </span>
        </div>
      </>
    );
  }
  if (!rv) {
    return (
      <>
        <Back />
        <Alert tone="error" title={review.status === 404 ? "Review not found" : "We couldn't load this review"} className="mt-6"
          action={review.status === 404 ? undefined : <Button variant="outline" size="sm" onClick={review.reload}>Try again</Button>}>
          {review.status === 404 ? "This review doesn't exist or isn't yours." : review.error}
        </Alert>
      </>
    );
  }
  const inProgress = rv.status === "pending" || rv.status === "processing";
  const attempts = rv.attempts && rv.maxAttempts ? `Attempt ${rv.attempts} of ${rv.maxAttempts}` : null;

  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader
          eyebrow="Resume review"
          title={rv.resumeName ? <BreakableText text={rv.resumeName} /> : "Resume assessment"}
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ReviewStatusBadge status={rv.status} />
              <span>
                {formatDateTime(rv.completedAt ?? rv.createdAt)}
                {attempts && rv.status !== "completed" ? ` · ${attempts}` : ""}
              </span>
            </span>
          }
          actions={rv.status === "completed" ? <DownloadReportButton reviewId={rv.id} /> : undefined}
        />
      </div>

      {inProgress && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <AutoRefresh onTick={review.reload} />
            <Loader2 className="size-9 animate-spin text-brand-600" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Your review is still being processed</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-600" aria-live="polite">
              This page checks again automatically. You can leave and come back from Review history.
            </p>
            {rv.canRetry && (
              <div className="mt-6 w-full max-w-md">
                <p className="mb-3 text-sm text-slate-600">It&apos;s taking longer than expected. You can retry it now.</p>
                <RetryReviewButton review={rv} onRetried={setRetried} embedded />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {rv.status === "failed" && (
        <Card>
          <CardBody className="py-8 sm:py-10">
            <div className="mx-auto max-w-lg text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
                <XCircle className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold">We couldn&apos;t finish this review</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Sorry about that — it isn&apos;t something you did wrong.{" "}
                {rv.failureReason ?? "The assessment couldn't be completed."}
              </p>
            </div>
            <div className="mx-auto mt-6 max-w-md">
              {rv.canRetry ? (
                <>
                  <p className="mb-4 text-center text-sm text-slate-600">
                    If your PDF is a scan or image, upload a text-based export first, then choose it below.
                  </p>
                  <RetryReviewButton review={rv} onRetried={setRetried} embedded />
                </>
              ) : (
                <Alert
                  tone="info"
                  title="No retries left"
                  action={
                    <LinkButton href="/contact" variant="outline" size="sm">
                      <LifeBuoy className="size-4" aria-hidden /> Contact support
                    </LinkButton>
                  }
                >
                  Please contact support with this review&apos;s details. Refunds are handled manually by our team.
                </Alert>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {rv.status === "completed" && <ReviewResults review={rv} />}

      {rv.status === "unknown" && (
        <>
          <Alert tone="warning" title="Unrecognised review status">
            <Clock className="mr-1 inline size-4" aria-hidden />
            The service returned this review without a status we recognise, so results can&apos;t be shown yet.
          </Alert>
          <div className="mt-6">
            <HeuristicDisclaimer text={rv.disclaimer} />
          </div>
        </>
      )}
    </>
  );
}
