import type { Metadata } from "next";
import { CheckCircle2, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";
import { IconTile, SectionHeading } from "@/components/ui/primitives";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "Hire Nigerian Professionals — Post a Job",
  description: "Submit remote, hybrid or on-site roles for review. Reach motivated Nigerian professionals. Every listing is reviewed before publication.",
  alternates: { canonical: "/employers" },
};

const POINTS = [
  { icon: Users, title: "Motivated candidates", body: "Our audience is Nigerian professionals actively preparing for their next role." },
  { icon: ClipboardCheck, title: "Reviewed listings", body: "Every submission is checked by our team before it goes live, which keeps the board trustworthy." },
  { icon: ShieldCheck, title: "Clear eligibility", body: "We label remote roles honestly, including whether Nigeria-based applicants can apply." },
];

const RULES = [
  "The role is real and you are authorised to advertise it",
  "Applicants are never asked to pay any fee",
  "The application link goes to your official careers page or ATS",
  "Location and eligibility requirements are stated accurately",
];

export default function EmployersPage() {
  return (
    <>
      <PageIntro
        eyebrow="For employers"
        title="Are you hiring?"
        actions={
          <>
            <LinkButton href="/employers/post-job" size="lg">
              Post a job
            </LinkButton>
            <LinkButton href={`mailto:${siteConfig.supportEmail}`} variant="outline" size="lg">
              Contact us
            </LinkButton>
          </>
        }
      >
        Share your remote, hybrid or on-site role with Nigerian professionals on {siteConfig.name}. Submitting a job is free and every
        listing will be reviewed before it&apos;s published.
      </PageIntro>
      <section className="container-page py-16">
        <ul className="grid gap-3 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, ...p }) => (
            <li key={p.title} className="tile p-5 sm:p-6">
              <IconTile>
                <Icon />
              </IconTile>
              <h2 className="mt-4 font-semibold">{p.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="border-t border-line bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2">
          <SectionHeading
            eyebrow="How it works"
            title="Submit → review → publish"
            description="Email us your role. We review it and may contact you to confirm details. Online submissions and the job board aren't open yet."
          />
          <div className="card p-6">
            <h3 className="font-semibold">Listing requirements</h3>
            <ul className="mt-4 space-y-3">
              {RULES.map((r) => (
                <li key={r} className="flex gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {r}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">We may decline or remove listings that don&apos;t meet these standards.</p>
          </div>
        </div>
      </section>
    </>
  );
}
