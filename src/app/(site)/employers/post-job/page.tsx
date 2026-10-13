import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { LinkButton } from "@/components/ui/button";

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
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Post a job</h1>
        <p className="mt-2 text-slate-600">
          Online job submissions aren&apos;t available yet. Email your role to our team instead — nothing is published until
          we&apos;ve reviewed it.
        </p>
        <div className="mt-8 card p-5 sm:p-8">
          <h2 className="text-lg font-semibold">What to include</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {INCLUDE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <LinkButton href={`mailto:${siteConfig.supportEmail}?subject=${subject}`} className="mt-6">
            <Mail className="size-4" aria-hidden /> Email {siteConfig.supportEmail}
          </LinkButton>
          <p className="mt-4 text-xs text-slate-500">Applicants must never be asked to pay any fee. We decline listings that do.</p>
        </div>
      </div>
    </div>
  );
}
