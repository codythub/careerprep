"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, XCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { AutoRefresh } from "@/components/candidate/actions";
import { HeuristicDisclaimer, ReviewResults, ReviewStatusBadge } from "@/components/candidate/review-view";
import { useApi, useCandidateAuth } from "@/components/candidate/auth";
import { Loading } from "@/components/candidate/views/loading";

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
    <span className="flex flex-col items-end">
      <Button variant="outline" size="sm" onClick={() => void download()} disabled={busy} aria-disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
        {busy ? "Preparing…" : "Download report"}
      </Button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}

export function ReviewDetailView({ id }: { id: string }) {
  const review = useApi((t) => api.getReview(t, id), [id]);
  const back = (
    <Link href="/dashboard/reviews" className="text-sm text-slate-500 hover:text-slate-900">
      ← Review history
    </Link>
  );

  if (review.loading && !review.data) {
    return (
      <>
        {back}
        <Loading />
      </>
    );
  }
  if (!review.data) {
    return (
      <>
        {back}
        <Alert tone="error" title={review.status === 404 ? "Review not found" : "We couldn't load this review"} className="mt-4">
          {review.status === 404 ? "This review doesn't exist or isn't yours." : review.error}
        </Alert>
      </>
    );
  }
  const rv = review.data;
  const inProgress = rv.status === "pending" || rv.status === "processing";

  return (
    <>
      {back}
      <PageHeader
        title={rv.resumeName ?? "Resume assessment"}
        description={`Started ${formatDateTime(rv.createdAt)}${rv.completedAt ? ` · completed ${formatDateTime(rv.completedAt)}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <ReviewStatusBadge status={rv.status} />
            {rv.status === "completed" && <DownloadReportButton reviewId={rv.id} />}
          </div>
        }
      />

      {inProgress && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <AutoRefresh onTick={review.reload} />
            <Loader2 className="size-10 animate-spin text-brand-600" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">Analysing your resume…</h2>
            <p className="mt-1 max-w-md text-sm text-slate-600" aria-live="polite">
              We&apos;re checking structure, content and keywords. This page updates automatically — you can also leave and come back
              from Review History.
            </p>
          </CardBody>
        </Card>
      )}

      {rv.status === "failed" && (
        <Card>
          <CardBody className="flex flex-col items-center py-10 text-center">
            <XCircle className="size-10 text-rose-500" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">This review couldn&apos;t be completed</h2>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              {rv.failureReason ?? "The assessment failed to process. Please contact support so we can help."}
            </p>
            <LinkButton href="/contact" variant="outline" className="mt-6">
              Contact support
            </LinkButton>
          </CardBody>
        </Card>
      )}

      {rv.status === "completed" && <ReviewResults review={rv} />}

      {rv.status === "unknown" && (
        <>
          <Alert tone="warning" title="Unrecognised review status">
            The service returned this review without a status we recognise, so results can&apos;t be shown yet.
          </Alert>
          <div className="mt-6">
            <HeuristicDisclaimer />
          </div>
        </>
      )}
    </>
  );
}
