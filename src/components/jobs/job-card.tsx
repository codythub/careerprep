import Link from "next/link";
import { Building2, CalendarClock } from "lucide-react";
import type { JobCard as JobCardData } from "@/server/services/jobs";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LEVEL_LABEL } from "@/lib/labels";
import { formatDate, formatSalary, timeAgo } from "@/lib/format";
import { EligibilityBadge, ListingFlags, WorkModeBadge } from "@/components/jobs/job-badges";

export function JobCard({ job, headingLevel = "h3" }: { job: JobCardData; headingLevel?: "h2" | "h3" }) {
  const salary = formatSalary(job);
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col gap-3 card card-hover p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <ListingFlags isFeatured={job.isFeatured} isSponsored={job.isSponsored} isDemo={job.isDemo} />
      </div>
      <div className="min-w-0">
        <Heading className="text-base font-semibold leading-snug text-slate-950">
          <Link href={`/jobs/${job.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
            {job.title}
          </Link>
        </Heading>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-600">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{job.companyName}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <WorkModeBadge mode={job.workMode} />
        <EligibilityBadge eligibility={job.nigeriaEligibility} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
        <div>
          <dt className="sr-only">Employment type</dt>
          <dd>{EMPLOYMENT_TYPE_LABEL[job.employmentType]}</dd>
        </div>
        <div>
          <dt className="sr-only">Experience level</dt>
          <dd>{EXPERIENCE_LEVEL_LABEL[job.experienceLevel]}</dd>
        </div>
        <div className="col-span-2">
          <dt className="sr-only">Location eligibility</dt>
          <dd className="truncate">{job.locationEligibility}</dd>
        </div>
        {salary && (
          <div className="col-span-2">
            <dt className="sr-only">Salary</dt>
            <dd className="font-medium text-slate-900">{salary}</dd>
          </div>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{job.postedAt ? `Posted ${timeAgo(job.postedAt)}` : ""}</span>
        {job.closingDate && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden />
            Closes {formatDate(job.closingDate)}
          </span>
        )}
      </div>
    </article>
  );
}
