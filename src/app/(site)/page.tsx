import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  MessagesSquare,
  ShieldCheck,
  Upload,
  CreditCard,
  Download,
  Target,
  XCircle,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatNaira } from "@/lib/format";
import { buttonClass, LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { JobCard } from "@/components/jobs/job-card";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { TrackView, TrackedLink } from "@/components/analytics";
import { featuredJobs, latestJobs } from "@/server/services/jobs";
import { publicStories, publicTestimonials } from "@/server/services/social-proof";

export const revalidate = 300;

// Each service gets its own accent so the section reads at a glance.
const SERVICES = [
  {
    icon: FileText,
    title: "Resume Review",
    body: "Upload your PDF and get an automated assessment — an overall score, category scores, weaknesses and practical recommendations.",
    href: "/resume-optimization",
    cta: "See what's included",
    accent: "border-t-emerald-500",
    iconCls: "bg-emerald-100 text-emerald-700",
    linkCls: "text-emerald-700 hover:text-emerald-800",
  },
  {
    icon: BriefcaseBusiness,
    title: "Remote Job Board",
    body: "Reviewed remote and local listings, with Nigeria eligibility clearly marked only where our team has confirmed it.",
    href: "/jobs",
    cta: "Browse jobs",
    accent: "border-t-sky-500",
    iconCls: "bg-sky-100 text-sky-700",
    linkCls: "text-sky-700 hover:text-sky-800",
  },
  {
    icon: MessagesSquare,
    title: "Interview & Career Guides",
    body: "Practical guidance on interviews, LinkedIn, cover letters, salary conversations, portfolios and staying safe from job scams.",
    href: "/career-guides",
    cta: "Read the guides",
    accent: "border-t-amber-500",
    iconCls: "bg-amber-100 text-amber-700",
    linkCls: "text-amber-700 hover:text-amber-800",
  },
];

const INCLUDED = [
  "An overall resume score",
  "Scores for each assessment category",
  "Specific weaknesses, explained clearly",
  "Practical, prioritised recommendations",
  "A downloadable report",
  "Every review saved to your history",
  "Rule-based guidance — not an ATS score",
];

const STEPS = [
  { icon: Target, title: "Create your account", body: "Free to join — your resumes and reviews are saved to your dashboard.", num: "bg-emerald-600", iconCls: "text-emerald-600" },
  { icon: Upload, title: "Upload your resume", body: "PDF, up to 5 MB. Stored privately — never publicly accessible.", num: "bg-sky-600", iconCls: "text-sky-600" },
  { icon: CreditCard, title: "Pay securely", body: "Checkout with Paystack. Payment is verified on our servers.", num: "bg-amber-500", iconCls: "text-amber-600" },
  { icon: Download, title: "Get your assessment", body: "Scores, weaknesses and recommendations — plus a downloadable report.", num: "bg-violet-600", iconCls: "text-violet-600" },
];

export default async function HomePage() {
  const [featured, testimonials, stories] = await Promise.all([
    featuredJobs(6),
    publicTestimonials(6),
    publicStories(3),
  ]);
  const jobs = featured.length > 0 ? featured : await latestJobs(6);
  // Display price only — the amount charged is set and verified by the CareerPrep (Laravel) backend.
  const price = formatNaira(siteConfig.resumeOptimization.defaultPriceKobo);

  return (
    <>
      <TrackView event="homepage_view" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-brand-100 via-white to-amber-50">
        <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-emerald-300/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-amber-200/50 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-10 right-1/4 size-64 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <ShieldCheck className="size-3.5" aria-hidden /> Built for Nigerian professionals
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">
              Prepare Better.{" "}
              <span className="bg-gradient-to-r from-brand-700 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Apply Smarter.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{siteConfig.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink event="resume_cta_click" href="/resume-optimization" className={buttonClass("primary", "lg")}>
                Review My Resume - {price}
              </TrackedLink>
              <LinkButton href="/jobs" variant="outline" size="lg">
                Find Remote Jobs
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              We improve how your experience is presented. We don&apos;t promise interviews or jobs — no honest service can.
            </p>
          </div>
        </div>
      </section>

      {/* Core services */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="What we do" title={siteConfig.brandMessage} description={siteConfig.supportingMessage} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SERVICES.map(({ icon: Icon, ...s }) => (
            <div key={s.title} className={`flex flex-col card border-t-4 p-6 ${s.accent}`}>
              <span className={`flex size-11 items-center justify-center rounded-xl ${s.iconCls}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
              <Link href={s.href} className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${s.linkCls}`}>
                {s.cta} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Resume optimization */}
      <section className="bg-gradient-to-br from-brand-50 via-emerald-50 to-teal-50">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow={`Resume Review · ${price}`}
              title="Find out what's holding your resume back"
              description="Many strong candidates are overlooked because their resume lists duties instead of results, or is hard for screening systems to read. Our automated assessment shows you exactly where to improve."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink event="resume_cta_click" href="/dashboard/resumes" className={buttonClass("primary", "lg")}>
                Upload my resume
              </TrackedLink>
              <LinkButton href="/resume-optimization" variant="ghost" size="lg">
                How it works <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </div>
          </div>
          <ul className="grid gap-3 card border-brand-200 p-6 sm:p-8">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Before / after */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Before & after"
          title="Small changes, clearer impact"
          description="An illustrative example of the kind of improvement our recommendations point you towards. It's not taken from a customer's resume."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card border-rose-200 bg-rose-50/60 p-6">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-rose-700 uppercase">
              <XCircle className="size-3.5" aria-hidden /> Before
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Responsible for handling customer complaints.</li>
              <li>Worked on social media for the company.</li>
              <li>Good communication skills and a team player.</li>
            </ul>
          </div>
          <div className="card border-emerald-300 bg-emerald-50 p-6">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold tracking-wide text-white uppercase">
              <Sparkles className="size-3.5" aria-hidden /> After
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-800 marker:text-emerald-600">
              <li>Resolved customer escalations across email and phone, introducing a response template that shortened first-reply times.</li>
              <li>Planned and published a weekly content calendar across three channels, growing engagement on product announcements.</li>
              <li>Coordinated with sales and operations to close recurring customer issues at the source.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      {jobs.length > 0 && (
        <section className="bg-gradient-to-b from-sky-50 to-white">
          <div className="container-page py-16 sm:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow="Remote jobs"
                title={featured.length > 0 ? "Featured opportunities" : "Latest opportunities"}
                description="“Remote” and “Nigeria Eligible” are different. We only show the Nigeria Eligible label when our team has confirmed it."
              />
              <LinkButton href="/jobs" variant="outline">
                View all jobs
              </LinkButton>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="How it works" title="Four simple steps" center />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, num, iconCls, ...s }, i) => (
            <li key={s.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white ${num}`}>{i + 1}</span>
                <Icon className={`size-5 ${iconCls}`} aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Testimonials — only rendered when real, approved testimonials exist */}
      {testimonials.length > 0 && (
        <section className="bg-gradient-to-b from-amber-50 to-white">
          <div className="container-page py-16 sm:py-20">
            <SectionHeading eyebrow="Testimonials" title="What customers say" description="Every testimonial here comes from a customer with a completed order." />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Success stories — only verified, consented stories */}
      {stories.length > 0 && (
        <section className="container-page py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Verified success stories" title="Real journeys from real customers" />
            <LinkButton href="/success-stories" variant="outline">
              All stories
            </LinkButton>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stories.map((s) => (
              <Link key={s.id} href={`/success-stories/${s.slug}`} className="card border-t-4 border-t-violet-500 p-6 card-hover">
                <p className="text-xs font-semibold text-violet-700">{s.careerField}</p>
                <h3 className="mt-2 font-semibold">{s.candidateName}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.outcome}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Interview preparation */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-slate-900 text-white">
        <div className="pointer-events-none absolute -top-24 right-10 size-80 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
        <div className="container-page relative grid gap-8 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-300">Interview preparation</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Walk into interviews prepared</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-emerald-100/90">
              Structured answers, company research and remote-interview readiness. Our free guides cover the questions
              you&apos;re most likely to face and how to answer them with evidence.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link href="/interview-preparation" className={buttonClass("inverse", "lg")}>
              Interview preparation
            </Link>
            <Link href="/career-guides" className={buttonClass("outlineInverse", "lg")}>
              All career guides
            </Link>
          </div>
        </div>
      </section>

      {/* Employer CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col gap-6 card border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-amber-700">For employers</p>
            <h2 className="mt-1 text-2xl font-semibold">Are you hiring?</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Reach motivated Nigerian professionals. Submit your role for free — every listing is reviewed before it goes live.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/employers/post-job" size="lg" variant="secondary">
              Post a job
            </LinkButton>
            <LinkButton href="/employers" variant="outline" size="lg">
              Learn more
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-amber-300/30 blur-3xl" aria-hidden />
        <div className="container-page relative py-16 text-center sm:py-20">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">{siteConfig.brandMessage}</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-50">Prepare better, apply smarter — starting with a resume that represents you well.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink event="resume_cta_click" href="/resume-optimization" className={buttonClass("inverse", "lg")}>
              Review My Resume - {price}
            </TrackedLink>
            <Link href="/jobs" className={buttonClass("outlineInverse", "lg")}>
              Find Remote Jobs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
