import { SearchX, SlidersHorizontal, ShieldAlert } from "lucide-react";
import type { JobFilters } from "@/lib/validation";
import { db } from "@/lib/db";
import { listPublicJobs } from "@/server/services/jobs";
import { JobCard } from "@/components/jobs/job-card";
import { JobFiltersForm } from "@/components/jobs/job-filters";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

export async function JobListing({ filters, basePath }: { filters: JobFilters; basePath: string }) {
  const [categories, result] = await Promise.all([
    db.jobCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    listPublicJobs(filters),
  ]);
  const activeFilters = Object.entries(filters).filter(([k, v]) => v !== undefined && k !== "page" && k !== "sort").length;
  const params = Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, v === undefined ? undefined : String(v)]));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside>
        <details className="group card lg:hidden" open={false}>
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-semibold">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden /> Filters{activeFilters ? ` (${activeFilters})` : ""}
            </span>
            <span className="text-slate-500 group-open:hidden">Show</span>
            <span className="hidden text-slate-500 group-open:inline">Hide</span>
          </summary>
          <div className="border-t border-slate-100 p-4">
            <JobFiltersForm filters={filters} categories={categories} action={basePath} />
          </div>
        </details>
        <div className="sticky top-20 hidden card p-5 lg:block">
          <JobFiltersForm filters={filters} categories={categories} action={basePath} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600" aria-live="polite">
            {result.total === 1 ? "1 job" : `${result.total} jobs`}
            {filters.ng ? " confirmed as Nigeria Eligible" : ""}
          </p>
        </div>
        <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong>Stay safe:</strong> legitimate employers never ask you to pay to get a job. Report any listing that does.
          </p>
        </div>
        {result.jobs.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" />}
            title="No jobs match these filters"
            action={
              <LinkButton href={basePath} variant="outline">
                Clear filters
              </LinkButton>
            }
          >
            Try removing a filter or searching for a broader keyword. New jobs are added after review.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {result.jobs.map((job) => (
              <JobCard key={job.id} job={job} headingLevel="h2" />
            ))}
          </div>
        )}
        <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} params={params} />
      </div>
    </div>
  );
}
