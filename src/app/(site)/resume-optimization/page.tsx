import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileSearch, Gauge, History, Lightbulb, ListChecks, Lock, ShieldCheck, XCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { Alert, IconTile, SectionHeading } from "@/components/ui/primitives";
import { FaqList } from "@/components/site/faq";
import { PriceText, PricingCard, ReviewCtaLabel } from "@/components/site/pricing";

export const metadata: Metadata = {
  title: "Resume Review & Assessment",
  description: "Upload your PDF resume and get an automated, rule-based assessment: an overall score, category scores, weaknesses and practical recommendations.",
  alternates: { canonical: "/resume-optimization" },
};

const INCLUDED = [
  { icon: Gauge, title: "Overall score", body: "A single score summarising how your resume performs against our assessment rules." },
  { icon: ListChecks, title: "Category scores", body: "Separate scores for the areas we check, so you can see exactly where to focus." },
  { icon: FileSearch, title: "Weaknesses", body: "Specific issues found in your resume, explained in plain language." },
  { icon: Lightbulb, title: "Recommendations", body: "Practical, prioritised changes you can make yourself." },
  { icon: History, title: "Review history", body: "Every assessment is saved to your dashboard so you can track improvements." },
  { icon: Download, title: "Downloadable report", body: "Keep a copy of your assessment to work from offline." },
  { icon: Lock, title: "Private by default", body: "Your PDF is stored privately and only used to generate your assessment." },
  { icon: ShieldCheck, title: "Honest guidance", body: "Rule-based guidance — not an ATS score and not a hiring guarantee." },
];

const STEPS: Array<[string, React.ReactNode]> = [
  ["Create an account", "So your resumes and reviews are saved securely."],
  ["Upload your resume as a PDF", "Up to 5 MB. We check the text can be read before you pay."],
  [
    "Pay securely with Paystack",
    <>
      Pay <PriceText fallback="the review price" />. Your review only unlocks after CareerPrep verifies the payment.
    </>,
  ],
  ["Run your review", "The assessment is generated automatically while you watch its progress."],
  ["Read your results", "See your scores, weaknesses and recommendations, and download the report."],
];

const FAQ = [
  { q: "How long does it take?", a: "The assessment runs as soon as you start it after payment is confirmed, and your results open automatically when it finishes." },
  { q: "Which files can I upload?", a: "PDF only, up to 5 MB, with selectable text. Scanned pages and images can't be assessed — we'll tell you before you pay." },
  { q: "What will I receive?", a: "An overall score, category scores, a list of weaknesses and practical recommendations, plus a downloadable report." },
  { q: "Is this an ATS score?", a: "No. It's rule-based guidance from CareerPrep's own checks. It does not reproduce any employer's applicant tracking system." },
  { q: "Will this get me a job?", a: "No service can honestly promise that. The assessment shows where your resume can be clearer and stronger; hiring decisions are made by employers." },
  {
    q: "Can I get a refund?",
    a: (
      <>
        If a review can&apos;t be completed you can retry it; after that our team handles refunds manually.{" "}
        <Link href="/refund-policy" className="font-medium text-brand-700 underline underline-offset-2">
          Read the refund policy
        </Link>
        .
      </>
    ),
  },
];

export default function ResumeOptimizationPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-brand-700">Resume review</p>
            <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">{siteConfig.brandMessage}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Upload your PDF resume and get an automated assessment: an overall score, category scores, the weaknesses holding it back
              and practical recommendations to fix them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/resumes" className={buttonClass("primary", "lg")}>
                <ReviewCtaLabel />
              </Link>
              <Link href="#how-it-works" className={buttonClass("outline", "lg")}>
                How it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">You&apos;ll create a free account first so your reviews are saved.</p>
          </div>
          <PricingCard />
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <p className="eyebrow">What you get</p>
        <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">A clear picture of your resume</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {INCLUDED.map(({ icon: Icon, title, body }) => (
            <li key={title} className="tile flex items-start gap-4 p-4 sm:p-5">
              <IconTile tone="neutral">
                <Icon />
              </IconTile>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="How it works" title="From upload to results" />
            <ol className="mt-8 space-y-5">
              {STEPS.map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
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
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {[
                  "Promise interviews, job offers or salary outcomes",
                  "Claim to reproduce any employer's ATS",
                  "Apply to jobs on your behalf",
                  "Share your resume with anyone without your permission",
                ].map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <Alert tone="info" title="An honest note">
              This automated rule-based review is guidance only. It is not an ATS score and does not guarantee hiring outcomes — hiring
              decisions depend on employers, the market and many factors outside anyone&apos;s control.
            </Alert>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Common questions</h2>
          <Link href="/dashboard/resumes" className={buttonClass("primary", "lg", "mt-8 hidden lg:inline-flex")}>
            <ReviewCtaLabel />
          </Link>
        </div>
        <FaqList items={FAQ} />
      </section>
    </>
  );
}
