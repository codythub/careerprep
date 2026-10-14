import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Temporary/preview deployments: keep the whole site out of search engines.
  if (process.env.SITE_NOINDEX === "true") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/login", "/register"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
