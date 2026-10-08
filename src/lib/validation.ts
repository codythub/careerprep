import { z } from "zod";
import { isSafeExternalUrl } from "@/lib/url";

// ── Primitives ───────────────────────────────────────────────────────────────

/** Optional free text: empty strings become undefined. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined));

export const requiredText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const passwordField = z
  .string({ error: "Password is required" })
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer");

export const externalUrl = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(2000)
    .refine(isSafeExternalUrl, `${label} must be a valid public http(s) link`);

export const optionalExternalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || isSafeExternalUrl(v), `${label} must be a valid public http(s) link`);

/** `<input type="date">` value → Date (end of day UTC) or undefined. */
export const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const d = new Date(`${v}T23:59:59.000Z`);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date" });
      return z.NEVER;
    }
    return d;
  });

export const optionalInt = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const n = Number(v.replace(/[,\s]/g, ""));
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number" });
      return z.NEVER;
    }
    return n;
  });

/** Unchecked checkboxes are absent from FormData, so the key must be optional. */
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .nullish()
  .transform((v) => v === "on" || v === "true");

const workMode = z.enum(["REMOTE", "HYBRID", "ONSITE"], { error: "Choose a work arrangement" });
const employmentType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"], {
  error: "Choose an employment type",
});
const experienceLevel = z.enum(["ENTRY", "MID", "SENIOR"], { error: "Choose an experience level" });
const optionalExperienceLevel = z
  .union([experienceLevel, z.literal("")])
  .nullish()
  .transform((v) => (v ? v : undefined));

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(200),
});

export const registerSchema = z
  .object({
    name: requiredText("Full name", 2, 80),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    acceptTerms: checkbox.refine((v) => v, "You must accept the terms and privacy policy"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const profileSchema = z.object({
  name: requiredText("Full name", 2, 80),
  phone: optionalText(30),
  headline: optionalText(120),
  location: optionalText(80),
  targetRole: optionalText(120),
  experienceLevel: optionalExperienceLevel,
  linkedinUrl: optionalExternalUrl("LinkedIn URL"),
  portfolioUrl: optionalExternalUrl("Portfolio URL"),
  preferredCategoryIds: z.array(z.string().max(40)).max(15).default([]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ── Resume orders ────────────────────────────────────────────────────────────

export const resumeOrderSchema = z.object({
  targetRole: requiredText("Target role", 2, 120),
  targetIndustry: optionalText(120),
  experienceLevel: optionalExperienceLevel,
  customerNotes: optionalText(2000),
  resumeId: optionalText(40),
  acceptTerms: checkbox.refine((v) => v, "Please accept the service terms to continue"),
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

const salaryCurrency = z
  .union([z.enum(["NGN", "USD", "GBP", "EUR", "CAD"]), z.literal("")])
  .nullish()
  .transform((v) => (v ? v : undefined));
const salaryPeriod = z
  .union([z.enum(["HOURLY", "MONTHLY", "YEARLY"]), z.literal("")])
  .nullish()
  .transform((v) => (v ? v : undefined));

function salaryRangeValid(d: { salaryMin?: number; salaryMax?: number }) {
  return d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMin <= d.salaryMax;
}

export const jobSchema = z
  .object({
    title: requiredText("Job title", 3, 140),
    companyName: requiredText("Company", 2, 120),
    companyWebsite: optionalExternalUrl("Company website"),
    description: requiredText("Description", 30, 20000),
    responsibilities: optionalText(10000),
    requirements: optionalText(10000),
    applicationInstructions: optionalText(3000),
    categoryId: requiredText("Category", 1, 40),
    workMode,
    locationEligibility: requiredText("Location eligibility", 2, 120),
    nigeriaEligibility: z.enum(["UNVERIFIED", "VERIFIED", "NOT_ELIGIBLE"]),
    eligibilityNote: optionalText(500),
    employmentType,
    experienceLevel,
    salaryMin: optionalInt,
    salaryMax: optionalInt,
    salaryCurrency,
    salaryPeriod,
    applyUrl: externalUrl("Application URL"),
    closingDate: optionalDate,
    isFeatured: checkbox,
    isSponsored: checkbox,
    companyVerified: checkbox,
    companyVerificationNote: optionalText(500),
  })
  .refine(salaryRangeValid, { path: ["salaryMax"], message: "Maximum must be greater than minimum" })
  .refine((d) => d.nigeriaEligibility !== "VERIFIED" || !!d.eligibilityNote, {
    path: ["eligibilityNote"],
    message: "Record how Nigeria eligibility was confirmed",
  });

export type JobInput = z.infer<typeof jobSchema>;

export const employerSubmissionSchema = z.object({
  companyName: requiredText("Company", 2, 120),
  companyWebsite: externalUrl("Company website"),
  recruiterName: requiredText("Recruiter name", 2, 80),
  recruiterEmail: emailField,
  jobTitle: requiredText("Job title", 3, 140),
  jobDescription: requiredText("Description", 50, 20000),
  responsibilities: optionalText(10000),
  requirements: optionalText(10000),
  salary: optionalText(120),
  location: requiredText("Location", 2, 120),
  workMode,
  employmentType,
  experienceLevel,
  applyUrl: externalUrl("Application URL"),
  closingDate: optionalDate.refine((d) => !d || d.getTime() > Date.now(), "Closing date must be in the future"),
  confirmLegitimate: checkbox.refine(
    (v) => v,
    "Please confirm the role is genuine and applicants will not be charged",
  ),
  website: z.string().max(0, "Invalid submission").optional().nullable(), // honeypot
});

export const jobReportSchema = z.object({
  jobId: z.string().min(1).max(40),
  reason: z.enum([
    "SUSPECTED_SCAM",
    "ASKS_FOR_PAYMENT",
    "MISLEADING_DETAILS",
    "NOT_NIGERIA_ELIGIBLE",
    "EXPIRED_OR_FILLED",
    "BROKEN_LINK",
    "OTHER",
  ]),
  details: optionalText(2000),
  reporterEmail: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined))
    .pipe(z.email("Enter a valid email address").optional()),
  website: z.string().max(0).optional().nullable(), // honeypot
});

export const JOB_FILTER_SORTS = ["newest", "closing", "salary"] as const;

export const jobFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional().catch(undefined),
  level: z.enum(["ENTRY", "MID", "SENIOR"]).optional().catch(undefined),
  remote: z.literal("1").optional().catch(undefined),
  ng: z.literal("1").optional().catch(undefined),
  salary: z.literal("1").optional().catch(undefined),
  sort: z.enum(JOB_FILTER_SORTS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type JobFilters = z.infer<typeof jobFiltersSchema>;

// ── Dashboard ────────────────────────────────────────────────────────────────

const applicationStatus = z.enum(["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]);

export const applicationSchema = z.object({
  jobId: optionalText(40),
  jobTitle: requiredText("Job title", 2, 140),
  companyName: requiredText("Company", 1, 120),
  applyUrl: optionalExternalUrl("Application link"),
  status: applicationStatus,
  appliedAt: optionalDate,
  notes: optionalText(3000),
});

export const applicationStatusSchema = z.object({
  id: z.string().min(1).max(40),
  status: applicationStatus,
});

// ── Social proof & content ───────────────────────────────────────────────────

export const testimonialSubmissionSchema = z.object({
  orderId: z.string().min(1).max(40),
  name: requiredText("Name", 2, 80),
  jobTitle: optionalText(100),
  company: optionalText(100),
  content: requiredText("Testimonial", 30, 1500),
  consentToPublish: checkbox.refine((v) => v, "We need your consent to publish your testimonial"),
});

export const successStorySchema = z.object({
  userEmail: optionalText(200),
  candidateName: requiredText("Candidate name", 2, 80),
  careerField: requiredText("Career field", 2, 100),
  previousSituation: requiredText("Previous situation", 20, 4000),
  serviceUsed: requiredText("Service used", 2, 120),
  targetRole: requiredText("Target role", 2, 120),
  improvements: requiredText("What was improved", 20, 4000),
  journey: requiredText("Application/interview journey", 20, 6000),
  outcome: requiredText("Outcome", 10, 4000),
  newRole: optionalText(120),
  company: optionalText(120),
  testimonial: optionalText(2000),
  consentToPublish: checkbox,
  isVerified: checkbox,
  verificationNote: optionalText(1000),
});

export const articleSchema = z.object({
  title: requiredText("Title", 5, 160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens"),
  excerpt: requiredText("Excerpt", 20, 300),
  content: requiredText("Content", 100, 60000),
  category: z.enum([
    "RESUME",
    "INTERVIEWS",
    "REMOTE_JOBS",
    "LINKEDIN",
    "COVER_LETTERS",
    "SALARY_NEGOTIATION",
    "PORTFOLIO",
    "CAREER_DEVELOPMENT",
    "SCAM_AWARENESS",
  ]),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  publish: checkbox,
});

export const settingsSchema = z.object({
  resumePriceNaira: z.coerce
    .number({ error: "Enter a price" })
    .int("Use a whole number")
    .min(500, "Minimum ₦500")
    .max(1_000_000, "Maximum ₦1,000,000"),
});

/** FormData → plain object; repeated keys become arrays only for the listed names. */
export function formDataToObject(formData: FormData, arrayKeys: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrayKeys.includes(key) ? all : all[0];
  }
  for (const k of arrayKeys) out[k] ??= [];
  return out;
}
