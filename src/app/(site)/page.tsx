import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Download,
  FileSearch,
  Gauge,
  History,
  Lightbulb,
  ListChecks,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
  XCircle,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { listGuides, GUIDE_CATEGORY_LABEL } from "@/content/guides";
import { buttonClass, LinkButton } from "@/components/ui/button";
import { IconTile, SectionHeading } from "@/components/ui/primitives";
import { FaqList } from "@/components/site/faq";
import { PriceText, PricingCard, ReviewCtaLabel } from "@/components/site/pricing";

const INCLUDED = [
  { icon: Gauge, title: "Overall score", body: "One score summarising how your resume performs against our checks." },
  { icon: ListChecks, title: "Category scores", body: "Contact details, summary, experience, skills, formatting and more." },
  { icon: FileSearch, title: "Weaknesses", body: "Specific issues found in your resume, explained in plain language." },
  { icon: Lightbulb, title: "Recommendations", body: "Practical changes you can make yourself, straight away." },
  { icon: Download, title: "Downloadable report", body: "Keep a copy to work from offline." },
  { icon: History, title: "Review history", body: "Every assessment is saved, so you can track your progress." },
];

const STEPS = [
  { icon: UserPlus, title: "Create a free account", body: "Your resumes and reviews are saved privately to your dashboard." },
  { icon: Upload, title: "Upload your PDF", body: "A text-based PDF up to 5 MB. We check it can be read before you pay." },
  { icon: CreditCard, title: "Pay securely", body: "Checkout with Paystack. Payment is verified on our servers." },
  { icon: Sparkles, title: "Get your assessment", body: "Scores, weaknesses and recommendations — plus a downloadable report." },
];

const FAQ = [
  { q: "What exactly do I get?", a: "An overall score, scores for each assessment category, a list of weaknesses and practical recommendations, plus a downloadable report saved to your review history." },
  { q: "Is this an ATS score?", a: "No. It's rule-based guidance from CareerPrep's own checks. It doesn't reproduce any employer's applicant tracking system." },
  { q: "Which files can I upload?", a: "PDF only, up to 5 MB. It must contain selectable text — scanned pages and photos can't be assessed, and we'll tell you before you pay." },
  { q: "Are my files private?", a: "Yes. Your resume is stored privately and is only used to generate your assessment. It's never shown publicly." },
  { q: "Will this get me a job?", a: "No honest service can promise that. The assessment shows where your resume can be clearer and stronger; hiring decisions are made by employers." },
  {
    q: "What if something goes wrong?",
    a: (
      <>
        If a review can&apos;t be completed you can retry it, and our team can help. See the{" "}
        <Link href="/refund-policy" className="font-medium text-brand-700 underline underline-offset-2">
          refund policy
        </Link>
        .
      </>
    ),
  },
];

export default function HomePage() {
  const guides = listGuides().slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="container-page py-16 text-center sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-slate-700">
            <ShieldCheck className="size-3.5 text-brand-600" aria-hidden /> Built for Nigerian professionals
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] font-semibold text-balance sm:text-6xl">
            Prepare better. <span className="text-brand-600">Apply smarter.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{siteConfig.description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/resume-optimization" className={buttonClass("primary", "lg")}>
              <ReviewCtaLabel />
            </Link>
            <LinkButton href="#how-it-works" variant="outline" size="lg">
              See how it works
            </LinkButton>
          </div>
          {/* Product facts only — no customer counts, ratings or logos. */}
          <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4">
            {[
              { value: <PriceText fallback="—" />, label: "Per review" },
              { value: "5 MB", label: "PDF upload" },
              { value: "Free", label: "Account" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col">
                <dt className="eyebrow order-2 mt-1 block">{f.label}</dt>
                <dd className="order-1 text-2xl font-semibold tabular-nums text-slate-950 sm:text-3xl">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-xs text-slate-500">We help you present your experience well. We don&apos;t promise interviews or jobs.</p>
        </div>
      </section>

      {/* What you get — tile grid (reference style) */}
      <section className="container-page py-16 sm:py-20">
        <p className="eyebrow">What you get</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-semibold sm:text-3xl">A clear picture of what&apos;s holding your resume back</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading eyebrow="How it works" title="Four simple steps" center />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="card p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <IconTile>
                    <Icon />
                  </IconTile>
                  <span className="text-sm font-semibold tabular-nums text-slate-300">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
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
          <div className="tile p-6">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <XCircle className="size-3.5 text-rose-500" aria-hidden /> Before
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Responsible for handling customer complaints.</li>
              <li>Worked on social media for the company.</li>
              <li>Good communication skills and a team player.</li>
            </ul>
          </div>
          <div className="card border-brand-200 p-6 shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700 uppercase">
              <Sparkles className="size-3.5" aria-hidden /> After
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-800 marker:text-brand-600">
              <li>Resolved customer escalations across email and phone, introducing a response template that shortened first-reply times.</li>
              <li>Planned and published a weekly content calendar across three channels, growing engagement on product announcements.</li>
              <li>Coordinated with sales and operations to close recurring customer issues at the source.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-line bg-surface">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Pricing"
              title="One simple price per review"
              description="Pay only when you want an assessment. Creating an account and uploading your resume are free — and we check your PDF can be read before you pay."
            />
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> Paystack checkout — card details never touch our servers
              </li>
              <li className="flex gap-2.5">
                <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> Your review unlocks only after CareerPrep verifies the payment
              </li>
            </ul>
          </div>
          <PricingCard />
        </div>
      </section>

      {/* Guides */}
      {guides.length > 0 && (
        <section className="container-page py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Free career guides</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Practical advice for every stage</h2>
            </div>
            <LinkButton href="/career-guides" variant="outline">
              All guides <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/career-guides/${g.slug}`} className="tile group flex h-full items-start gap-4 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:p-5">
                  <IconTile tone="neutral">
                    <BookOpen />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{GUIDE_CATEGORY_LABEL[g.category]}</p>
                    <h3 className="mt-0.5 font-semibold group-hover:text-brand-700">{g.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{g.excerpt}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* REPLACE: testimonials — add a section here only with real, consented customer quotes. Nothing is shown until then. */}

      {/* FAQ */}
      <section className="border-t border-line">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Frequently asked questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Still unsure?{" "}
              <Link href="/contact" className="font-medium text-brand-700 underline underline-offset-2">
                Contact us
              </Link>
              .
            </p>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>

      {/* Final call to action — the single solid brand block */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="rounded-2xl bg-brand-600 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-semibold text-white sm:text-4xl">{siteConfig.brandMessage}</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-50">Start with a resume that represents you well. Upload it free and see the price before you pay.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/resume-optimization" className={buttonClass("inverse", "lg")}>
              <ReviewCtaLabel />
            </Link>
            <Link href="/career-guides" className={buttonClass("outlineInverse", "lg")}>
              Read the guides
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
