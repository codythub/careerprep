import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/site/logo";

const COLUMNS = [
  {
    title: "Services",
    links: [
      { href: "/resume-optimization", label: "Resume Review" },
      { href: "/interview-preparation", label: "Interview Preparation" },
      { href: "/success-stories", label: "Success Stories" },
    ],
  },
  {
    title: "Jobs",
    links: [
      { href: "/jobs", label: "Remote Jobs" },
      { href: "/jobs?ng=1", label: "Nigeria Eligible Jobs" },
      { href: "/employers", label: "For Employers" },
      { href: "/employers/post-job", label: "Post a Job" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/career-guides", label: "Career Guides" },
      { href: "/career-guides/job-scam-awareness", label: "Job Scam Awareness" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
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
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{siteConfig.brandMessage}</p>
            <p className="mt-4 text-sm text-slate-600">
              <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium text-slate-800 hover:text-brand-700">
                {siteConfig.supportEmail}
              </a>
            </p>
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
                <ul className="mt-3 space-y-2">
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
        <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            © {new Date().getFullYear()} {siteConfig.legalName}. {siteConfig.name} provides career services and a job
            listing platform. We do not guarantee interviews or employment. Job listings are provided by third parties —
            always verify employers and <strong className="font-semibold text-slate-700">never pay anyone to get a job</strong>.
          </p>
        </div>
      </div>
    </footer>
  );
}
