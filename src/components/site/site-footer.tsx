import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/site/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/resume-optimization", label: "Resume Review" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/register", label: "Create an account" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/career-guides", label: "Career Guides" },
      { href: "/interview-preparation", label: "Interview Preparation" },
      { href: "/career-guides/job-scam-awareness", label: "Job Scam Awareness" },
      { href: "/jobs", label: "Jobs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/employers", label: "For Employers" },
      { href: "/success-stories", label: "Success Stories" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url);
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{siteConfig.brandMessage}</p>
            <a href={`mailto:${siteConfig.supportEmail}`} className="mt-4 inline-block text-sm font-medium text-slate-800 hover:text-brand-700">
              {siteConfig.supportEmail}
            </a>
            {socials.length > 0 && (
              <ul className="mt-4 flex gap-4 text-sm">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a href={url} rel="noopener noreferrer" target="_blank" className="capitalize text-slate-600 hover:text-brand-700">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-sm font-semibold text-slate-900">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-slate-600 hover:text-brand-700">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-slate-500 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">
            © {new Date().getFullYear()} {siteConfig.legalName}. Our reviews are automated, rule-based guidance — we don&apos;t guarantee
            interviews or employment. Always verify employers and{" "}
            <strong className="font-semibold text-slate-700">never pay anyone to get a job</strong>.
          </p>
          <p className="shrink-0">Made for Nigerian professionals</p>
        </div>
      </div>
    </footer>
  );
}
