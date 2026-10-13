"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { useApi } from "@/components/candidate/auth";
import { usePageParam } from "@/components/candidate/use-page";
import { ListSkeleton } from "@/components/candidate/views/loading";

export function ReviewsView() {
  const page = usePageParam();
  const reviews = useApi((t) => api.listReviews(t, page), [page]);
  const list = reviews.data?.items ?? [];

  return (
    <>
      <PageHeader title="Review history" description="Every assessment you've run, newest first." />
      {reviews.loading ? (
        <ListSkeleton label="Loading your reviews…" />
      ) : reviews.error ? (
        <Alert tone="error" title="We couldn't load your reviews" action={<Button variant="outline" size="sm" onClick={reviews.reload}>Try again</Button>}>
          {reviews.error}
        </Alert>
      ) : list.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="No reviews yet" action={<LinkButton href="/dashboard/resumes">Review a resume</LinkButton>}>
          Upload a PDF resume and pay for a review to see your first assessment here.
        </EmptyState>
      ) : (
        <>
          {/* Mobile: tappable cards */}
          <ul className="space-y-3 md:hidden">
            {list.map((rv) => (
              <li key={rv.id}>
                <Link href={`/dashboard/reviews/${rv.id}`} className="card card-hover flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{rv.resumeName ?? "Resume"}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <ReviewStatusBadge status={rv.status} />
                      <span>{formatDate(rv.createdAt)}</span>
                    </div>
                  </div>
                  {rv.status === "completed" && <ScorePill score={rv.overallScore} max={rv.overallMax} />}
                  <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop: table */}
          <div className="hidden md:block">
            <TableWrap>
              <thead>
                <tr>
                  <th>Resume</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((rv) => (
                  <tr key={rv.id}>
                    <td className="max-w-72 truncate font-medium text-slate-900">{rv.resumeName ?? "Resume"}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(rv.createdAt)}</td>
                    <td>{rv.status === "completed" ? <ScorePill score={rv.overallScore} max={rv.overallMax} /> : <span className="text-slate-400">—</span>}</td>
                    <td>
                      <ReviewStatusBadge status={rv.status} />
                    </td>
                    <td className="text-right">
                      <Link href={`/dashboard/reviews/${rv.id}`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
                        Open <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
          <Pagination page={reviews.data!.currentPage} pageCount={reviews.data!.lastPage} basePath="/dashboard/reviews" params={{}} />
        </>
      )}
    </>
  );
}
