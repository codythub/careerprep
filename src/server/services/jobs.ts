import type { JobStatus, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { uniqueSlug } from "@/lib/slug";
import type { JobFilters, JobInput, employerSubmissionSchema, jobReportSchema } from "@/lib/validation";
import { UserError } from "@/server/errors";
import { audit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { sendEmail } from "@/server/email/send";
import { emails } from "@/server/email/templates";
import { track } from "@/server/analytics";

type Actor = { id: string; role: Role };
export const JOBS_PAGE_SIZE = 20;
const REPORT_ALERT_THRESHOLD = 3;

// ── Public visibility ────────────────────────────────────────────────────────

/** The only definition of "publicly visible": published and not past its closing date. */
export function publicJobWhere(now: Date = new Date()): Prisma.JobWhereInput {
  return { status: "PUBLISHED", OR: [{ closingDate: null }, { closingDate: { gte: now } }] };
}

export const jobCardSelect = {
  id: true,
  slug: true,
  title: true,
  companyName: true,
  companyLogoUrl: true,
  workMode: true,
  locationEligibility: true,
  nigeriaEligibility: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  postedAt: true,
  closingDate: true,
  isFeatured: true,
  isSponsored: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.JobSelect;

export type JobCard = Prisma.JobGetPayload<{ select: typeof jobCardSelect }>;

export function buildJobWhere(filters: JobFilters, now: Date = new Date()): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [publicJobWhere(now)];
  if (filters.q) {
    const q = filters.q;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.category) and.push({ category: { slug: filters.category } });
  if (filters.type) and.push({ employmentType: filters.type });
  if (filters.level) and.push({ experienceLevel: filters.level });
  if (filters.remote) and.push({ workMode: "REMOTE" });
  // Nigeria Eligible filter: ONLY admin-verified jobs. "Remote" never implies eligibility.
  if (filters.ng) and.push({ nigeriaEligibility: "VERIFIED" });
  if (filters.salary) and.push({ OR: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }] });
  return { AND: and };
}

function orderBy(sort: JobFilters["sort"]): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "closing":
      return [{ closingDate: { sort: "asc", nulls: "last" } }, { postedAt: "desc" }];
    case "salary":
      return [{ salaryMax: { sort: "desc", nulls: "last" } }, { salaryMin: { sort: "desc", nulls: "last" } }, { postedAt: "desc" }];
    default:
      return [{ postedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function listPublicJobs(filters: JobFilters) {
  const where = buildJobWhere(filters);
  const page = filters.page ?? 1;
  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      select: jobCardSelect,
      orderBy: orderBy(filters.sort),
      skip: (page - 1) * JOBS_PAGE_SIZE,
      take: JOBS_PAGE_SIZE,
    }),
  ]);
  return { jobs, total, page, pageCount: Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE)) };
}

export async function featuredJobs(limit = 6) {
  return db.job.findMany({
    where: { AND: [publicJobWhere(), { isFeatured: true }] },
    select: jobCardSelect,
    orderBy: { postedAt: "desc" },
    take: limit,
  });
}

export async function latestJobs(limit = 6) {
  return db.job.findMany({ where: publicJobWhere(), select: jobCardSelect, orderBy: { postedAt: "desc" }, take: limit });
}

export async function getPublicJobBySlug(slug: string) {
  return db.job.findFirst({ where: { AND: [{ slug }, publicJobWhere()] }, include: { category: true } });
}

/** Simple, explainable matching: preferred categories + experience level. No AI. */
export async function recommendedJobsFor(userId: string, limit = 20) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { experienceLevel: true, preferredCategories: { select: { id: true } } },
  });
  const categoryIds = user?.preferredCategories.map((c) => c.id) ?? [];
  if (categoryIds.length === 0 && !user?.experienceLevel) return { jobs: [], needsPreferences: true };
  const and: Prisma.JobWhereInput[] = [publicJobWhere()];
  if (categoryIds.length) and.push({ categoryId: { in: categoryIds } });
  if (user?.experienceLevel) and.push({ experienceLevel: user.experienceLevel });
  const jobs = await db.job.findMany({ where: { AND: and }, select: jobCardSelect, orderBy: { postedAt: "desc" }, take: limit });
  return { jobs, needsPreferences: false };
}

// ── Saved jobs & apply tracking ──────────────────────────────────────────────

export async function toggleSavedJob(userId: string, jobId: string): Promise<boolean> {
  const existing = await db.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
  if (existing) {
    await db.savedJob.delete({ where: { userId_jobId: { userId, jobId } } });
    return false;
  }
  const job = await db.job.findFirst({ where: { AND: [{ id: jobId }, publicJobWhere()] }, select: { id: true } });
  if (!job) throw new UserError("This job is no longer available.");
  await db.savedJob.create({ data: { userId, jobId } });
  await track("job_saved", { userId, jobId });
  return true;
}

/** Returns the employer's own application URL for a public job, after logging the click. */
export async function recordApplyClick(jobId: string, userId: string | null): Promise<string | null> {
  const job = await db.job.findFirst({ where: { AND: [{ id: jobId }, publicJobWhere()] }, select: { id: true, applyUrl: true } });
  if (!job) return null;
  await db.jobApplyClick.create({ data: { jobId, userId } });
  await track("job_apply_click", { userId, jobId });
  return job.applyUrl;
}

// ── Admin job management ─────────────────────────────────────────────────────

function jobData(input: JobInput) {
  return {
    title: input.title,
    companyName: input.companyName,
    companyWebsite: input.companyWebsite ?? null,
    description: input.description,
    responsibilities: input.responsibilities ?? null,
    requirements: input.requirements ?? null,
    applicationInstructions: input.applicationInstructions ?? null,
    categoryId: input.categoryId,
    workMode: input.workMode,
    locationEligibility: input.locationEligibility,
    nigeriaEligibility: input.nigeriaEligibility,
    eligibilityNote: input.eligibilityNote ?? null,
    employmentType: input.employmentType,
    experienceLevel: input.experienceLevel,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryCurrency: input.salaryMin != null || input.salaryMax != null ? (input.salaryCurrency ?? "USD") : null,
    salaryPeriod: input.salaryMin != null || input.salaryMax != null ? (input.salaryPeriod ?? "YEARLY") : null,
    applyUrl: input.applyUrl,
    closingDate: input.closingDate ?? null,
    isFeatured: input.isFeatured,
    isSponsored: input.isSponsored,
    companyVerified: input.companyVerified,
    companyVerificationNote: input.companyVerificationNote ?? null,
  };
}

async function assertCategory(categoryId: string) {
  const exists = await db.jobCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!exists) throw new UserError("Choose a valid category.");
}

export async function adminCreateJob(admin: Actor, input: JobInput) {
  assertAdmin(admin);
  await assertCategory(input.categoryId);
  const slug = await uniqueSlug(`${input.title} ${input.companyName}`, async (s) => !!(await db.job.findUnique({ where: { slug: s } })));
  const job = await db.job.create({
    data: {
      ...jobData(input),
      slug,
      status: "DRAFT",
      source: "ADMIN",
      createdById: admin.id,
      ...(input.nigeriaEligibility === "VERIFIED" ? { verifiedAt: new Date(), verifiedById: admin.id } : {}),
    },
  });
  await audit(admin.id, "job.create", "Job", job.id);
  return job;
}

export async function adminUpdateJob(admin: Actor, jobId: string, input: JobInput) {
  assertAdmin(admin);
  await assertCategory(input.categoryId);
  const current = await db.job.findUnique({ where: { id: jobId }, select: { nigeriaEligibility: true } });
  if (!current) throw new UserError("Job not found.");
  const eligibilityChanged = current.nigeriaEligibility !== input.nigeriaEligibility;
  const job = await db.job.update({
    where: { id: jobId },
    data: {
      ...jobData(input),
      ...(eligibilityChanged
        ? input.nigeriaEligibility === "VERIFIED"
          ? { verifiedAt: new Date(), verifiedById: admin.id }
          : { verifiedAt: null, verifiedById: null }
        : {}),
    },
  });
  await audit(admin.id, "job.update", "Job", jobId, eligibilityChanged ? { nigeriaEligibility: input.nigeriaEligibility } : undefined);
  return job;
}

export async function adminSetJobStatus(admin: Actor, jobId: string, status: Extract<JobStatus, "PUBLISHED" | "DRAFT" | "EXPIRED">) {
  assertAdmin(admin);
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) throw new UserError("Job not found.");
  if (status === "PUBLISHED") {
    if (!job.companyVerified && !job.isDemo) {
      throw new UserError("Confirm the employer is genuine (Company verified) before publishing.");
    }
    if (job.closingDate && job.closingDate < new Date()) {
      throw new UserError("This job's closing date has passed. Update the closing date before publishing.");
    }
  }
  await db.job.update({
    where: { id: jobId },
    data: { status, ...(status === "PUBLISHED" && !job.postedAt ? { postedAt: new Date() } : {}) },
  });
  await audit(admin.id, `job.${status.toLowerCase()}`, "Job", jobId);
}

export async function adminToggleFeatured(admin: Actor, jobId: string) {
  assertAdmin(admin);
  const job = await db.job.findUnique({ where: { id: jobId }, select: { isFeatured: true } });
  if (!job) throw new UserError("Job not found.");
  await db.job.update({ where: { id: jobId }, data: { isFeatured: !job.isFeatured } });
  await audit(admin.id, job.isFeatured ? "job.unfeature" : "job.feature", "Job", jobId);
}

export async function adminDeleteJob(admin: Actor, jobId: string) {
  assertAdmin(admin);
  await db.job.delete({ where: { id: jobId } });
  await audit(admin.id, "job.delete", "Job", jobId);
}

/** Cron: expire published jobs whose closing date has passed. */
export async function expireClosedJobs(now: Date = new Date()): Promise<number> {
  const { count } = await db.job.updateMany({
    where: { status: "PUBLISHED", closingDate: { lt: now } },
    data: { status: "EXPIRED" },
  });
  return count;
}

// ── Employer submissions ─────────────────────────────────────────────────────

export type EmployerSubmissionInput = z.infer<typeof employerSubmissionSchema>;

export async function submitEmployerJob(input: EmployerSubmissionInput, ip: string) {
  if (input.website) throw new UserError("Your submission could not be accepted."); // honeypot tripped
  const [ipOk, emailOk] = await Promise.all([
    rateLimit("employerSubmission", `ip:${ip}`),
    rateLimit("employerSubmission", `email:${input.recruiterEmail}`),
  ]);
  if (!ipOk || !emailOk) throw new UserError("You've submitted several jobs recently. Please try again later.");
  const submission = await db.employerSubmission.create({
    data: {
      companyName: input.companyName,
      companyWebsite: input.companyWebsite,
      recruiterName: input.recruiterName,
      recruiterEmail: input.recruiterEmail,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
      experienceLevel: input.experienceLevel,
      salary: input.salary,
      location: input.location,
      workMode: input.workMode,
      employmentType: input.employmentType,
      applyUrl: input.applyUrl,
      closingDate: input.closingDate,
      status: "PENDING",
      submitterIp: ip,
    },
  });
  await track("employer_submission", { props: { submissionId: submission.id } });
  await sendEmail(input.recruiterEmail, emails.submissionReceived(input.companyName, input.jobTitle));
  return submission;
}

/** Approve → creates a DRAFT job. Nothing becomes public until an admin publishes it. */
export async function adminApproveSubmission(admin: Actor, submissionId: string, categoryId: string) {
  assertAdmin(admin);
  await assertCategory(categoryId);
  const sub = await db.employerSubmission.findUnique({ where: { id: submissionId } });
  if (!sub) throw new UserError("Submission not found.");
  if (sub.status !== "PENDING") throw new UserError("This submission has already been reviewed.");
  const slug = await uniqueSlug(`${sub.jobTitle} ${sub.companyName}`, async (s) => !!(await db.job.findUnique({ where: { slug: s } })));

  const job = await db.$transaction(async (trx) => {
    const created = await trx.job.create({
      data: {
        slug,
        title: sub.jobTitle,
        companyName: sub.companyName,
        companyWebsite: sub.companyWebsite,
        description: sub.jobDescription,
        responsibilities: sub.responsibilities,
        requirements: sub.requirements,
        categoryId,
        workMode: sub.workMode,
        locationEligibility: sub.location,
        nigeriaEligibility: "UNVERIFIED",
        employmentType: sub.employmentType,
        experienceLevel: sub.experienceLevel ?? "MID",
        applyUrl: sub.applyUrl,
        closingDate: sub.closingDate,
        applicationInstructions: sub.salary ? `Salary as provided by employer: ${sub.salary}` : null,
        status: "DRAFT",
        source: "EMPLOYER_SUBMISSION",
        createdById: admin.id,
      },
    });
    const res = await trx.employerSubmission.updateMany({
      where: { id: submissionId, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date(), jobId: created.id },
    });
    if (res.count === 0) throw new UserError("This submission has already been reviewed.");
    await audit(admin.id, "submission.approve", "EmployerSubmission", submissionId, { jobId: created.id }, trx);
    return created;
  });
  await sendEmail(sub.recruiterEmail, emails.submissionApproved(sub.jobTitle));
  return job;
}

export async function adminRejectSubmission(admin: Actor, submissionId: string, reason?: string) {
  assertAdmin(admin);
  const sub = await db.employerSubmission.findUnique({ where: { id: submissionId } });
  if (!sub) throw new UserError("Submission not found.");
  const res = await db.employerSubmission.updateMany({
    where: { id: submissionId, status: "PENDING" },
    data: { status: "REJECTED", reviewNote: reason ?? null, reviewedById: admin.id, reviewedAt: new Date() },
  });
  if (res.count === 0) throw new UserError("This submission has already been reviewed.");
  await audit(admin.id, "submission.reject", "EmployerSubmission", submissionId, { reason: reason ?? null });
  await sendEmail(sub.recruiterEmail, emails.submissionRejected(sub.jobTitle, reason));
}

// ── Reports ──────────────────────────────────────────────────────────────────

export type JobReportInput = z.infer<typeof jobReportSchema>;

export async function reportJob(input: JobReportInput, userId: string | null, ip: string) {
  if (input.website) throw new UserError("Your report could not be submitted.");
  if (!(await rateLimit("jobReport", userId ? `user:${userId}` : `ip:${ip}`))) {
    throw new UserError("You've sent several reports recently. Please try again later.");
  }
  const job = await db.job.findUnique({ where: { id: input.jobId }, select: { id: true, title: true } });
  if (!job) throw new UserError("Job not found.");
  await db.jobReport.create({
    data: { jobId: job.id, userId, reporterEmail: input.reporterEmail, reason: input.reason, details: input.details },
  });
  const open = await db.jobReport.count({ where: { jobId: job.id, status: "OPEN" } });
  if (open === REPORT_ALERT_THRESHOLD && env.adminAlertEmail) {
    await sendEmail(env.adminAlertEmail, emails.jobReportAlert(job.title, open, `${env.siteUrl}/admin/reports`));
  }
}

export async function adminResolveReport(admin: Actor, reportId: string, status: "ACTIONED" | "DISMISSED") {
  assertAdmin(admin);
  await db.jobReport.update({ where: { id: reportId }, data: { status, resolvedAt: new Date() } });
  await audit(admin.id, `report.${status.toLowerCase()}`, "JobReport", reportId);
}

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
}
