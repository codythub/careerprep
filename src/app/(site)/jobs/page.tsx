import type { Metadata } from "next";
import { after } from "next/server";
import { jobFiltersSchema } from "@/lib/validation";
import { JobListing } from "@/components/jobs/job-listing";
import { track } from "@/server/analytics";

export const metadata: Metadata = {
  title: "Remote Jobs for Nigerian Professionals",
  description:
    "Browse reviewed remote and local jobs. Nigeria eligibility is only shown when confirmed by our team. Filter by category, type, level and salary.",
  alternates: { canonical: "/jobs" },
};

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const raw = await searchParams;
  const filters = jobFiltersSchema.parse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));

  after(async () => {
    if (filters.q) await track("job_search", { path: "/jobs", props: { q: filters.q } });
    const applied = Object.fromEntries(
      Object.entries(filters).filter(([k, v]) => v !== undefined && !["q", "page", "sort"].includes(k)),
    );
    if (Object.keys(applied).length) await track("job_filter", { path: "/jobs", props: applied as Record<string, string> });
  });

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Remote jobs</h1>
        <p className="mt-2 text-slate-600">
          Every listing is reviewed before publishing. <strong className="font-semibold text-slate-800">Remote</strong> and{" "}
          <strong className="font-semibold text-slate-800">Nigeria Eligible</strong> are different — we only show Nigeria
          Eligible when our team has confirmed it.
        </p>
      </div>
      <JobListing filters={filters} basePath="/jobs" />
    </div>
  );
}
