import type { Metadata } from "next";
import { Lock, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";
import { IconTile } from "@/components/ui/primitives";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name}: ${siteConfig.supportingMessage}`,
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Honesty first", body: "We never promise jobs, publish fake testimonials or invent statistics." },
  { icon: Sparkles, title: "Practical guidance", body: "Every recommendation is something you can act on yourself, today." },
  { icon: Lock, title: "Your data is yours", body: "Resumes are stored privately and shared with no one without your permission." },
  { icon: ShieldAlert, title: "Safety", body: "Our free guides help you spot job scams — and never pay anyone to get a job." },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow={`About ${siteConfig.name}`}
        title={siteConfig.brandMessage}
        actions={
          <>
            <LinkButton href="/resume-optimization" size="lg">
              Review my resume
            </LinkButton>
            <LinkButton href="/career-guides" variant="outline" size="lg">
              Read the guides
            </LinkButton>
          </>
        }
      >
        <p>{siteConfig.supportingMessage}</p>
        <p className="mt-4 text-base">
          Many talented Nigerian professionals struggle with resumes that undersell them, finding legitimate opportunities, and feeling
          unprepared for applications and interviews. {siteConfig.name} exists to help — practically and honestly.
        </p>
      </PageIntro>
      <section className="container-page py-16">
        <p className="eyebrow">What we stand for</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="tile flex items-start gap-4 p-5">
              <IconTile tone="neutral">
                <Icon />
              </IconTile>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
