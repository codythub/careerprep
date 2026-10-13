import type { Metadata } from "next";
import { CheckCircle2, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "Post a Job",
  description: "Send us your role for review. Listings are published only after our team checks them.",
  alternates: { canonical: "/employers/post-job" },
};

const INCLUDE = [
  "Company name and website",
  "Your name and work email",
  "Job title, description, responsibilities and requirements",
  "Work arrangement (remote, hybrid or on-site), employment type and level",
  "Where applicants must be based, and whether Nigeria-based applicants can apply",
  "The application link on your careers page or ATS, and the closing date",
];

/**
 * The CareerPrep Laravel API has no employer-submission endpoint yet, so there is no online form:
 * a form that can't store anything would only pretend to accept submissions.
 */
export default function PostJobPage() {
  const subject = encodeURIComponent("Job submission");
  return (
    <>
      <PageIntro eyebrow="For employers" title="Post a job">
        Online job submissions aren&apos;t available yet. Email your role to our team instead — nothing is published until we&apos;ve
        reviewed it.
      </PageIntro>
      <div className="container-page py-10 sm:py-14">
        <div className="card max-w-3xl p-5 sm:p-8">
          <h2 className="text-lg font-semibold">What to include</h2>
          <ul className="mt-4 space-y-2.5">
            {INCLUDE.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {item}
              </li>
            ))}
          </ul>
          <LinkButton href={`mailto:${siteConfig.supportEmail}?subject=${subject}`} className="mt-6">
            <Mail className="size-4" aria-hidden /> Email {siteConfig.supportEmail}
          </LinkButton>
          <p className="mt-4 text-xs text-slate-500">Applicants must never be asked to pay any fee. We decline listings that do.</p>
        </div>
      </div>
    </>
  );
}
