import { siteConfig } from "@/config/site";

export function formatNaira(kobo: number): string {
  return `${siteConfig.currencySymbol}${(kobo / 100).toLocaleString("en-NG", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

const SALARY_PERIOD_LABEL = { HOURLY: "/hr", MONTHLY: "/mo", YEARLY: "/yr" } as const;

export function formatSalary(job: {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: keyof typeof SALARY_PERIOD_LABEL | null;
}): string | null {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const cur = job.salaryCurrency ?? "";
  const fmt = (n: number) => `${cur === "NGN" ? "₦" : cur === "USD" ? "$" : cur === "GBP" ? "£" : cur === "EUR" ? "€" : `${cur} `}${n.toLocaleString("en-US")}`;
  const period = job.salaryPeriod ? SALARY_PERIOD_LABEL[job.salaryPeriod] : "";
  if (job.salaryMin != null && job.salaryMax != null && job.salaryMin !== job.salaryMax) {
    return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}${period}`;
  }
  return `${fmt((job.salaryMin ?? job.salaryMax)!)}${period}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * 86_400_000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
