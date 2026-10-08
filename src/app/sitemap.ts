import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { publicJobWhere } from "@/server/services/jobs";
import { publicStoryWhere } from "@/server/services/social-proof";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const staticPaths = [
    "",
    "/resume-optimization",
    "/jobs",
    "/career-guides",
    "/success-stories",
    "/interview-preparation",
    "/employers",
    "/employers/post-job",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/disclaimer",
  ];
  const [jobs, categories, articles, stories] = await Promise.all([
    // Demo listings are never included.
    db.job.findMany({ where: { AND: [publicJobWhere(), { isDemo: false }] }, select: { slug: true, updatedAt: true } }),
    db.jobCategory.findMany({ select: { slug: true } }),
    db.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.successStory.findMany({ where: publicStoryWhere, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: `${base}/jobs/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...jobs.map((j) => ({ url: `${base}/jobs/${j.slug}`, lastModified: j.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...articles.map((a) => ({ url: `${base}/career-guides/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
    ...stories.map((s) => ({ url: `${base}/success-stories/${s.slug}`, lastModified: s.updatedAt, priority: 0.5 })),
  ];
}
