import type {
  ApplicationStatus,
  EmploymentType,
  ExperienceLevel,
  GuideCategory,
  NigeriaEligibility,
  OrderStatus,
  ReportReason,
  WorkMode,
} from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  RECEIVED: "Received",
  IN_REVIEW: "In Review",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const EXPERIENCE_LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY: "Entry Level",
  MID: "Mid Level",
  SENIOR: "Senior Level",
};

export const ELIGIBILITY_LABEL: Record<NigeriaEligibility, string> = {
  VERIFIED: "Nigeria Eligible",
  UNVERIFIED: "Check eligibility before applying",
  NOT_ELIGIBLE: "Not open to Nigeria-based applicants",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const GUIDE_CATEGORY_LABEL: Record<GuideCategory, string> = {
  RESUME: "Resume",
  INTERVIEWS: "Interviews",
  REMOTE_JOBS: "Remote Jobs",
  LINKEDIN: "LinkedIn",
  COVER_LETTERS: "Cover Letters",
  SALARY_NEGOTIATION: "Salary",
  PORTFOLIO: "Portfolio",
  CAREER_DEVELOPMENT: "Career Development",
  SCAM_AWARENESS: "Job Scam Awareness",
};

export const GUIDE_CATEGORY_SLUG: Record<GuideCategory, string> = {
  RESUME: "resume",
  INTERVIEWS: "interviews",
  REMOTE_JOBS: "remote-jobs",
  LINKEDIN: "linkedin",
  COVER_LETTERS: "cover-letters",
  SALARY_NEGOTIATION: "salary",
  PORTFOLIO: "portfolio",
  CAREER_DEVELOPMENT: "career-development",
  SCAM_AWARENESS: "job-scam-awareness",
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SUSPECTED_SCAM: "Looks like a scam",
  ASKS_FOR_PAYMENT: "Asks applicants to pay",
  MISLEADING_DETAILS: "Misleading or incorrect details",
  NOT_NIGERIA_ELIGIBLE: "Not actually open to Nigerian applicants",
  EXPIRED_OR_FILLED: "Expired or already filled",
  BROKEN_LINK: "Application link is broken",
  OTHER: "Something else",
};

export function options<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
