import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listGuides } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  // /jobs and /success-stories are left out until they have content from the backend.
  const staticPaths = [
    "",
    "/resume-optimization",
    "/career-guides",
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
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...listGuides().map((g) => ({ url: `${base}/career-guides/${g.slug}`, priority: 0.6 })),
  ];
}
