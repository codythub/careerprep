"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { LinkButton } from "@/components/ui/button";
import { Alert, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { useApi } from "@/components/candidate/auth";
import { usePageParam } from "@/components/candidate/use-page";
import { Loading } from "@/components/candidate/views/loading";

export function ReviewsView() {
  const page = usePageParam();
  const reviews = useApi((t) => api.listReviews(t, page), [page]);
  const list = reviews.data?.items ?? [];

  return (
    <>
      <PageHeader title="Review History" description="Every assessment you've run, newest first." />
      {reviews.loading ? (
        <Loading label="Loading your reviews…" />
      ) : reviews.error ? (
        <Alert tone="error" title="We couldn't load your reviews">
          {reviews.error}
        </Alert>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No reviews yet"
          action={<LinkButton href="/dashboard/resumes">Review a resume</LinkButton>}
        >
          Upload a PDF resume and pay for a review to see your first assessment here.
        </EmptyState>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th>Resume</th>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((rv) => (
                <tr key={rv.id}>
                  <td className="max-w-64 truncate font-medium">{rv.resumeName ?? "Resume"}</td>
                  <td className="whitespace-nowrap">{formatDate(rv.createdAt)}</td>
                  <td>{rv.status === "completed" ? <ScorePill score={rv.overallScore} max={rv.overallMax} /> : "—"}</td>
                  <td><ReviewStatusBadge status={rv.status} /></td>
                  <td className="text-right">
                    <Link href={`/dashboard/reviews/${rv.id}`} className="font-semibold text-brand-700 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={reviews.data!.currentPage} pageCount={reviews.data!.lastPage} basePath="/dashboard/reviews" params={{}} />
        </>
      )}
    </>
  );
}
