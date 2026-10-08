import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowUpRight, Building2, CalendarClock, ShieldAlert, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/labels";
import { formatDate, formatSalary } from "@/lib/format";
import { hostnameOf } from "@/lib/url";
import { buttonClass } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/markdown";
import { EligibilityBadge, ListingFlags, WorkModeBadge } from "@/components/jobs/job-badges";
import { ReportJobForm } from "@/components/jobs/job-actions";
import { getPublicJobBySlug } from "@/server/services/jobs";
import { track } from "@/server/analytics";

export async function generateMetadata({ params }: PageProps<"/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) return { title: "Job not found", robots: { index: false } };
  const title = `${job.title} at ${job.companyName}`;
  const description = `${WORK_MODE_LABEL[job.workMode]} · ${EMPLOYMENT_TYPE_LABEL[job.employmentType]} · ${EXPERIENCE_LEVEL_LABEL[job.experienceLevel]} · ${job.locationEligibility}`;
  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title, description, url: `/jobs/${job.slug}`, type: "website" },
    // Demo listings must never be indexed as real opportunities.
    robots: job.isDemo ? { index: false, follow: false } : undefined,
  };
}

const EMPLOYMENT_TYPE_SCHEMA = { FULL_TIME: "FULL_TIME", PART_TIME: "PART_TIME", CONTRACT: "CONTRACTOR", INTERNSHIP: "INTERN" } as const;

export default async function JobDetailPage({ params }: PageProps<"/jobs/[slug]">) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) notFound();

  const salary = formatSalary(job);
  const applyHost = hostnameOf(job.applyUrl);

  after(() => track("job_view", { path: `/jobs/${job.slug}`, jobId: job.id }));

  const jsonLd = job.isDemo
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: [job.description, job.responsibilities, job.requirements].filter(Boolean).join("\n\n"),
        datePosted: job.postedAt?.toISOString(),
        validThrough: job.closingDate?.toISOString(),
        employmentType: EMPLOYMENT_TYPE_SCHEMA[job.employmentType],
        hiringOrganization: { "@type": "Organization", name: job.companyName, ...(job.companyWebsite ? { sameAs: job.companyWebsite } : {}) },
        ...(job.workMode === "REMOTE"
          ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: job.nigeriaEligibility === "VERIFIED" ? "Nigeria" : job.locationEligibility } }
          : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.locationEligibility, addressCountry: "NG" } } }),
        ...(job.salaryMin != null || job.salaryMax != null
          ? {
              baseSalary: {
                "@type": "MonetaryAmount",
                currency: job.salaryCurrency,
                value: {
                  "@type": "QuantitativeValue",
                  minValue: job.salaryMin ?? job.salaryMax,
                  maxValue: job.salaryMax ?? job.salaryMin,
                  unitText: job.salaryPeriod === "HOURLY" ? "HOUR" : job.salaryPeriod === "MONTHLY" ? "MONTH" : "YEAR",
                },
              },
            }
          : {}),
      };

  return (
    <div className="container-page py-8 sm:py-12">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <Link href="/jobs" className="hover:text-slate-900">
          Jobs
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/jobs/category/${job.category.slug}`} className="hover:text-slate-900">
          {job.category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <ListingFlags isFeatured={job.isFeatured} isSponsored={job.isSponsored} isDemo={job.isDemo} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{job.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-lg text-slate-700">
            <Building2 className="size-5 shrink-0 text-slate-400" aria-hidden />
            {job.companyWebsite ? (
              <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-brand-700">
                {job.companyName}
              </a>
            ) : (
              job.companyName
            )}
            {job.companyVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <ShieldCheck className="size-4" aria-hidden /> Employer checked
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <WorkModeBadge mode={job.workMode} />
            <EligibilityBadge eligibility={job.nigeriaEligibility} />
          </div>

          {job.isDemo && (
            <Alert tone="error" title="Demo listing" className="mt-6">
              This is sample content used for development and testing. It is not a real job opportunity.
            </Alert>
          )}
          {job.nigeriaEligibility === "UNVERIFIED" && job.workMode === "REMOTE" && (
            <Alert tone="warning" title="Check eligibility before applying" className="mt-6">
              This job is remote, but we haven&apos;t confirmed that the employer accepts applicants based in Nigeria. Read the
              location requirements carefully or ask the employer before applying.
            </Alert>
          )}
          {job.nigeriaEligibility === "NOT_ELIGIBLE" && (
            <Alert tone="error" title="Not open to Nigeria-based applicants" className="mt-6">
              The employer has restricted this role to: {job.locationEligibility}.
            </Alert>
          )}

          <Card className="mt-6">
            <CardBody>
              <DefinitionList
                items={[
                  ["Work arrangement", WORK_MODE_LABEL[job.workMode]],
                  ["Location eligibility", job.locationEligibility],
                  ["Employment type", EMPLOYMENT_TYPE_LABEL[job.employmentType]],
                  ["Experience level", EXPERIENCE_LEVEL_LABEL[job.experienceLevel]],
                  ["Salary", salary ?? "Not disclosed"],
                  ["Posted", formatDate(job.postedAt)],
                  ["Closing date", job.closingDate ? formatDate(job.closingDate) : "Not specified"],
                  ["Category", job.category.name],
                ]}
              />
            </CardBody>
          </Card>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">About the role</h2>
            <Markdown className="mt-3">{job.description}</Markdown>
          </section>
          {job.responsibilities && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Responsibilities</h2>
              <Markdown className="mt-3">{job.responsibilities}</Markdown>
            </section>
          )}
          {job.requirements && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Requirements</h2>
              <Markdown className="mt-3">{job.requirements}</Markdown>
            </section>
          )}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">How to apply</h2>
            {job.applicationInstructions && <Markdown className="mt-3">{job.applicationInstructions}</Markdown>}
            <p className="mt-3 text-sm text-slate-600">
              Applications are made directly on the employer&apos;s website: <strong className="text-slate-900">{applyHost}</strong>.{" "}
              {siteConfig.name} is not involved in the employer&apos;s hiring decisions.
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardBody className="space-y-3">
              <a
                href={`/api/jobs/${job.id}/apply`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "lg", "w-full")}
              >
                Apply on {applyHost} <ArrowUpRight className="size-4" aria-hidden />
              </a>
              <p className="text-center text-xs text-slate-500">Opens the employer&apos;s official application page</p>
            </CardBody>
          </Card>
          <div className="flex gap-3 card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <strong>Never pay to get a job.</strong> Legitimate employers don&apos;t charge for applications, training or
              equipment. <Link href="/career-guides/job-scam-awareness" className="underline underline-offset-2">Learn the warning signs</Link>.
            </p>
          </div>
          {job.closingDate && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarClock className="size-4" aria-hidden /> Closes {formatDate(job.closingDate)}
            </p>
          )}
          <ReportJobForm jobId={job.id} />
          <div className="card p-4 text-sm">
            <p className="font-semibold">Is your resume ready?</p>
            <p className="mt-1 text-slate-600">Get an automated assessment with practical recommendations.</p>
            <Link href="/resume-optimization" className="mt-2 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Review my resume →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
