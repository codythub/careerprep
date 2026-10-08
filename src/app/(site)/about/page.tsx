import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";
import { accent } from "@/lib/accents";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name}: ${siteConfig.supportingMessage}`,
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  ["Honesty first", "We never promise jobs, publish fake testimonials or invent statistics."],
  ["Verified, not assumed", "“Nigeria Eligible” appears only when our team has confirmed it."],
  ["Your data is yours", "Resumes are stored privately and shared with no one without your permission."],
  ["Safety", "Every listing is reviewed, and anyone can report a suspicious job."],
];

export default function AboutPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-brand-700">About {siteConfig.name}</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{siteConfig.brandMessage}</h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">{siteConfig.supportingMessage}</p>
        <p className="mt-4 leading-relaxed text-slate-600">
          Many talented Nigerian professionals struggle with three things: resumes that undersell them, not knowing where to
          find legitimate remote opportunities, and feeling unprepared for applications and interviews. {siteConfig.name}{" "}
          exists to help with all three — practically and honestly.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map(([t, b], i) => (
          <div key={t} className={`card border-t-4 p-6 ${accent(i).top}`}>
            <h2 className={`font-semibold ${accent(i).text}`}>{t}</h2>
            <p className="mt-1 text-sm text-slate-600">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/resume-optimization" size="lg">
          Review my resume
        </LinkButton>
        <LinkButton href="/jobs" variant="outline" size="lg">
          Browse jobs
        </LinkButton>
      </div>
    </div>
  );
}
