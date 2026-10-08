import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatNaira } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";
import { Alert, SectionHeading } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/analytics";
import { accent } from "@/lib/accents";

export const metadata: Metadata = {
  title: "Resume Review & Assessment",
  description: "Upload your PDF resume and get an automated, rule-based assessment: an overall score, category scores, weaknesses and practical recommendations.",
  alternates: { canonical: "/resume-optimization" },
};

const INCLUDED = [
  ["Overall score", "A single score summarising how your resume performs against our assessment rules."],
  ["Category scores", "Separate scores for the areas we check, so you can see exactly where to focus."],
  ["Weaknesses", "Specific issues found in your resume, explained in plain language."],
  ["Recommendations", "Practical, prioritised changes you can make yourself."],
  ["Review history", "Every assessment is saved to your dashboard so you can track improvements."],
  ["Downloadable report", "Keep a copy of your assessment to work from offline."],
  ["Private by default", "Your PDF is stored privately and only used to generate your assessment."],
  ["Honest guidance", "Rule-based guidance — not an ATS score and not a hiring guarantee."],
] as const;

const FAQ = [
  ["How long does it take?", "The assessment runs automatically once your payment is confirmed — usually within moments. Your dashboard updates when it's ready."],
  ["Which files can I upload?", "PDF only, up to 5 MB. Files are stored privately."],
  ["What will I receive?", "An overall score, category scores, a list of weaknesses and practical recommendations, plus a downloadable report."],
  ["Is this an ATS score?", "No. It's rule-based guidance from CareerPrep's own checks. It does not reproduce any employer's applicant tracking system."],
  ["Will this get me a job?", "No service can honestly promise that. The assessment shows where your resume can be clearer and stronger; hiring decisions are made by employers."],
  ["Can I get a refund?", "See our refund policy for details."],
] as const;

export default function ResumeOptimizationPage() {
  // Display price only — the amount charged is set and verified by the CareerPrep (Laravel) backend.
  const price = formatNaira(siteConfig.resumeOptimization.defaultPriceKobo);
  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-brand-700">Resume Review</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{siteConfig.brandMessage}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Upload your PDF resume and get an automated assessment: an overall score, category scores, the weaknesses
              holding it back and practical recommendations to fix them.
            </p>
          </div>
          <div className="card p-6 sm:p-8">
            <p className="text-sm text-slate-600">Per review</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{price}</p>
            <p className="mt-1 text-sm text-slate-500">Results in your dashboard after payment is confirmed</p>
            <TrackedLink event="resume_cta_click" href="/dashboard/resumes" className={buttonClass("primary", "lg", "mt-6 w-full")}>
              Review My Resume - {price}
            </TrackedLink>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><Lock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> Secure payment with Paystack</li>
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> Your resume is stored privately</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> Scores, weaknesses &amp; recommendations</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">You&apos;ll create a free account first so your reviews are saved.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="What you get" title="A clear picture of your resume" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map(([title, body], i) => (
            <div key={title} className={`card border-t-4 p-5 ${accent(i).top}`}>
              <span className={`flex size-10 items-center justify-center rounded-xl ${accent(i).icon}`}>
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-brand-50 via-emerald-50 to-sky-50">
        <div className="container-page grid gap-8 py-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="How it works" title="From upload to results" />
            <ol className="mt-8 space-y-5">
              {[
                ["Create an account", "So your resumes and reviews are saved securely."],
                ["Upload your resume as a PDF", "Up to 5 MB. It's stored privately."],
                ["Pay securely with Paystack", `Pay ${price}. Your review only unlocks after CareerPrep verifies the payment.`],
                ["Run your review", "Click “Review My Resume”. The assessment is generated automatically."],
                ["Read your results", "See your scores, weaknesses and recommendations, and download the report."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${["bg-emerald-600", "bg-sky-600", "bg-amber-500", "bg-violet-600", "bg-teal-600"][i]}`}>{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{t}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold">What we don&apos;t do</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {[
                  "Promise interviews, job offers or salary outcomes",
                  "Claim to reproduce any employer's ATS",
                  "Apply to jobs on your behalf",
                  "Share your resume with anyone without your permission",
                ].map((x) => (
                  <li key={x} className="flex gap-2">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <Alert tone="info" title="An honest note">
              The assessment is rule-based guidance to help you improve your resume. It does not guarantee interviews or
              employment — hiring decisions depend on employers, the market and many factors outside anyone&apos;s control.
            </Alert>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="FAQ" title="Common questions" />
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="card p-5">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600">
                {a}
                {q.includes("refund") && (
                  <>
                    {" "}
                    <Link href="/refund-policy" className="font-medium text-brand-700 underline underline-offset-2">
                      Read the refund policy
                    </Link>
                    .
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-12 text-center">
          <TrackedLink event="resume_cta_click" href="/dashboard/resumes" className={buttonClass("primary", "lg")}>
            Review My Resume - {price}
          </TrackedLink>
        </div>
      </section>
    </>
  );
}
