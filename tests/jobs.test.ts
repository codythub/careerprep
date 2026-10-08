import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { isSafeExternalUrl } from "@/lib/url";
import { employerSubmissionSchema, jobFiltersSchema, jobSchema } from "@/lib/validation";
import {
  adminApproveSubmission,
  adminCreateJob,
  adminRejectSubmission,
  adminSetJobStatus,
  adminUpdateJob,
  expireClosedJobs,
  getPublicJobBySlug,
  listPublicJobs,
  recordApplyClick,
  reportJob,
  submitEmployerJob,
  toggleSavedJob,
} from "@/server/services/jobs";
import { createAdmin, createCategory, createJob, createUser } from "./helpers";

const DAY = 86_400_000;

function submission(overrides: Record<string, unknown> = {}) {
  return employerSubmissionSchema.parse({
    companyName: "Acme Ltd",
    companyWebsite: "https://acme.example.com",
    recruiterName: "Tolu Ade",
    recruiterEmail: "tolu@acme.example.com",
    jobTitle: "Customer Success Associate",
    jobDescription: "Help our customers succeed. ".repeat(5),
    location: "Remote — Africa",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    experienceLevel: "ENTRY",
    applyUrl: "https://acme.example.com/careers/1",
    confirmLegitimate: "on",
    ...overrides,
  });
}

describe("public visibility", () => {
  it("only PUBLISHED, non-closed jobs are public", async () => {
    const cat = await createCategory();
    const live = await createJob(cat.id);
    const draft = await createJob(cat.id, { status: "DRAFT" });
    const closed = await createJob(cat.id, { closingDate: new Date(Date.now() - DAY) });
    const expired = await createJob(cat.id, { status: "EXPIRED" });
    const { jobs } = await listPublicJobs({});
    expect(jobs.map((j) => j.id)).toEqual([live.id]);
    expect(await getPublicJobBySlug(draft.slug)).toBeNull();
    expect(await getPublicJobBySlug(closed.slug)).toBeNull();
    expect(await getPublicJobBySlug(expired.slug)).toBeNull();
  });

  it("cron expires jobs past their closing date", async () => {
    const cat = await createCategory();
    const job = await createJob(cat.id, { closingDate: new Date(Date.now() - DAY) });
    expect(await expireClosedJobs()).toBe(1);
    expect((await db.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("EXPIRED");
  });
});

describe("Nigeria eligibility", () => {
  it("the Nigeria Eligible filter returns ONLY admin-verified jobs; remote alone is not enough", async () => {
    const cat = await createCategory();
    const verified = await createJob(cat.id, { nigeriaEligibility: "VERIFIED" });
    await createJob(cat.id, { workMode: "REMOTE", nigeriaEligibility: "UNVERIFIED", locationEligibility: "Worldwide" });
    await createJob(cat.id, { workMode: "REMOTE", nigeriaEligibility: "NOT_ELIGIBLE" });
    const { jobs } = await listPublicJobs(jobFiltersSchema.parse({ ng: "1" }));
    expect(jobs.map((j) => j.id)).toEqual([verified.id]);
  });

  it("new jobs default to UNVERIFIED and VERIFIED requires a note and records who verified", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const base = {
      title: "Analyst",
      companyName: "Acme",
      description: "x".repeat(40),
      categoryId: cat.id,
      workMode: "REMOTE",
      locationEligibility: "Worldwide",
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      applyUrl: "https://acme.example.com/apply",
    };
    const unverified = jobSchema.parse({ ...base, nigeriaEligibility: "UNVERIFIED" });
    const job = await adminCreateJob(admin, unverified);
    expect(job.nigeriaEligibility).toBe("UNVERIFIED");
    expect(job.status).toBe("DRAFT");

    expect(jobSchema.safeParse({ ...base, nigeriaEligibility: "VERIFIED" }).success).toBe(false);
    const verifiedInput = jobSchema.parse({ ...base, nigeriaEligibility: "VERIFIED", eligibilityNote: "Confirmed by recruiter email" });
    const updated = await adminUpdateJob(admin, job.id, verifiedInput);
    expect(updated.verifiedById).toBe(admin.id);
    expect(updated.verifiedAt).not.toBeNull();
  });
});

describe("filters", () => {
  it("filters by category, type, level, remote, salary and search", async () => {
    const tech = await createCategory("Technology");
    const sales = await createCategory("Sales");
    const a = await createJob(tech.id, { title: "React Engineer", employmentType: "CONTRACT", experienceLevel: "SENIOR", salaryMin: 3000, salaryMax: 5000, salaryCurrency: "USD", salaryPeriod: "MONTHLY" });
    const b = await createJob(sales.id, { title: "Sales Rep", workMode: "ONSITE", experienceLevel: "ENTRY" });
    const ids = async (f: Record<string, string>) => (await listPublicJobs(jobFiltersSchema.parse(f))).jobs.map((j) => j.id);
    expect(await ids({ category: "technology" })).toEqual([a.id]);
    expect(await ids({ type: "CONTRACT" })).toEqual([a.id]);
    expect(await ids({ level: "ENTRY" })).toEqual([b.id]);
    expect(await ids({ remote: "1" })).toEqual([a.id]);
    expect(await ids({ salary: "1" })).toEqual([a.id]);
    expect(await ids({ q: "react" })).toEqual([a.id]);
  });

  it("ignores invalid filter values instead of erroring", () => {
    expect(jobFiltersSchema.parse({ type: "HACK", page: "-3", ng: "yes" })).toEqual({ type: undefined, page: undefined, ng: undefined });
  });
});

describe("publication rules", () => {
  it("cannot publish until the employer is verified and the closing date is in the future", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const job = await createJob(cat.id, { status: "DRAFT", companyVerified: false, postedAt: null });
    await expect(adminSetJobStatus(admin, job.id, "PUBLISHED")).rejects.toThrow(/Confirm the employer/);
    await db.job.update({ where: { id: job.id }, data: { companyVerified: true, closingDate: new Date(Date.now() - DAY) } });
    await expect(adminSetJobStatus(admin, job.id, "PUBLISHED")).rejects.toThrow(/closing date has passed/);
    await db.job.update({ where: { id: job.id }, data: { closingDate: new Date(Date.now() + DAY) } });
    await adminSetJobStatus(admin, job.id, "PUBLISHED");
    const published = await db.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(published.status).toBe("PUBLISHED");
    expect(published.postedAt).not.toBeNull();
  });

  it("non-admins cannot change job status", async () => {
    const user = await createUser();
    const cat = await createCategory();
    const job = await createJob(cat.id, { status: "DRAFT" });
    await expect(adminSetJobStatus({ id: user.id, role: "USER" }, job.id, "PUBLISHED")).rejects.toThrow(/permission/);
  });
});

describe("employer submissions", () => {
  it("submissions are PENDING and never public", async () => {
    const sub = await submitEmployerJob(submission(), "5.5.5.5");
    expect(sub.status).toBe("PENDING");
    expect(await db.job.count()).toBe(0);
  });

  it("rejects unsafe application URLs and past closing dates", () => {
    expect(employerSubmissionSchema.safeParse({ ...submission(), applyUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(employerSubmissionSchema.safeParse({ ...submission(), applyUrl: "http://localhost/x" }).success).toBe(false);
    expect(employerSubmissionSchema.safeParse({ ...submission(), closingDate: "2000-01-01" }).success).toBe(false);
    expect(isSafeExternalUrl("https://jobs.lever.co/acme/123")).toBe(true);
  });

  it("honeypot submissions are refused", async () => {
    await expect(submitEmployerJob({ ...submission(), website: "spam" }, "5.5.5.6")).rejects.toThrow();
  });

  it("approval creates an unpublished DRAFT job; rejection records the reason", async () => {
    const admin = await createAdmin();
    const cat = await createCategory();
    const sub = await submitEmployerJob(submission(), "5.5.5.7");
    const job = await adminApproveSubmission(admin, sub.id, cat.id);
    expect(job.status).toBe("DRAFT");
    expect(job.nigeriaEligibility).toBe("UNVERIFIED");
    expect(job.source).toBe("EMPLOYER_SUBMISSION");
    expect((await listPublicJobs({})).total).toBe(0);
    await expect(adminApproveSubmission(admin, sub.id, cat.id)).rejects.toThrow(/already been reviewed/);

    const sub2 = await submitEmployerJob(submission({ jobTitle: "Second role" }), "5.5.5.8");
    await adminRejectSubmission(admin, sub2.id, "Could not verify company");
    const rejected = await db.employerSubmission.findUniqueOrThrow({ where: { id: sub2.id } });
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.reviewNote).toBe("Could not verify company");
  });
});

describe("saved jobs, reports and apply clicks", () => {
  it("toggles saved jobs for public jobs only", async () => {
    const user = await createUser();
    const cat = await createCategory();
    const job = await createJob(cat.id);
    expect(await toggleSavedJob(user.id, job.id)).toBe(true);
    expect(await db.savedJob.count({ where: { userId: user.id } })).toBe(1);
    expect(await toggleSavedJob(user.id, job.id)).toBe(false);
    const draft = await createJob(cat.id, { status: "DRAFT" });
    await expect(toggleSavedJob(user.id, draft.id)).rejects.toThrow(/no longer available/);
  });

  it("records reports and apply clicks", async () => {
    const cat = await createCategory();
    const job = await createJob(cat.id);
    await reportJob({ jobId: job.id, reason: "ASKS_FOR_PAYMENT", details: "Asked for a training fee", reporterEmail: undefined, website: undefined }, null, "6.6.6.6");
    expect(await db.jobReport.count({ where: { jobId: job.id, status: "OPEN" } })).toBe(1);
    expect(await recordApplyClick(job.id, null)).toBe("https://acme.example.com/apply");
    expect(await db.jobApplyClick.count({ where: { jobId: job.id } })).toBe(1);
  });
});
