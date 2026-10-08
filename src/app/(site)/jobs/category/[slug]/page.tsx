import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { jobFiltersSchema } from "@/lib/validation";
import { JobListing } from "@/components/jobs/job-listing";

export async function generateMetadata({ params }: PageProps<"/jobs/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.jobCategory.findUnique({ where: { slug } });
  if (!category) return {};
  return {
    title: `${category.name} Jobs`,
    description: `Reviewed ${category.name.toLowerCase()} jobs for Nigerian professionals, with Nigeria eligibility clearly marked.`,
    alternates: { canonical: `/jobs/category/${slug}` },
  };
}

export default async function CategoryJobsPage({ params, searchParams }: PageProps<"/jobs/category/[slug]">) {
  const { slug } = await params;
  const category = await db.jobCategory.findUnique({ where: { slug } });
  if (!category) notFound();
  const raw = await searchParams;
  const filters = jobFiltersSchema.parse({
    ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])),
    category: slug,
  });
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">{category.name} jobs</h1>
        <p className="mt-2 text-slate-600">Reviewed listings. Nigeria eligibility is shown only when confirmed.</p>
      </div>
      <JobListing filters={filters} basePath={`/jobs/category/${slug}`} />
    </div>
  );
}
