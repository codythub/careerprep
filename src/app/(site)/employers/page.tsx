import type { Metadata } from "next";
import { CheckCircle2, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { accent } from "@/lib/accents";

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
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container-page py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-700">For employers</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Are you hiring?</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Share your remote, hybrid or on-site role with Nigerian professionals on {siteConfig.name}. Submitting a job is
              free and every listing is reviewed before it&apos;s published.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/employers/post-job" size="lg">
                Post a job
              </LinkButton>
              <LinkButton href={`mailto:${siteConfig.supportEmail}`} variant="outline" size="lg">
                Contact us
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
      <section className="container-page py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, ...p }, i) => (
            <div key={p.title} className={`card border-t-4 p-6 ${accent(i).top}`}>
              <span className={`flex size-11 items-center justify-center rounded-xl ${accent(i).icon}`}>
                <Icon className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 font-semibold">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2">
          <SectionHeading
            eyebrow="How it works"
            title="Submit → review → publish"
            description="Submit your role with the form. We review it, may contact you to confirm details, then publish it. You'll get an email when it's approved."
          />
          <div className="card p-6">
            <h3 className="font-semibold">Listing requirements</h3>
            <ul className="mt-4 space-y-3">
              {RULES.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-slate-700">
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
