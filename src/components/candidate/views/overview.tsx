"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ClipboardList, CreditCard, FileText, FileUp, Gauge, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import type { Payment, Resume, Review } from "@/lib/laravel/types";
import { buttonClass, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, IconTile, PageHeader, Skeleton, Stat } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score";
import { BreakableText } from "@/components/ui/breakable";
import { StartReviewButton } from "@/components/candidate/actions";
import { ReviewStatusBadge } from "@/components/candidate/review-view";
import { useApi, useCandidateAuth } from "@/components/candidate/auth";

type NextAction =
  | { kind: "start"; payment: Payment }
  | { kind: "confirm"; payment: Payment }
  | { kind: "pay"; resume: Resume }
  | { kind: "upload" }
  | { kind: "latest"; review: Review };

/** The single most useful next step, from real account data (newest records first). */
function pickNextAction(resumes: Resume[], reviews: Review[], payments: Payment[]): NextAction {
  const ready = payments.find((p) => p.entitlementStatus === "available");
  if (ready) return { kind: "start", payment: ready };
  const unconfirmed = payments.find((p) => p.status === "initialized" && p.reference);
  if (unconfirmed) return { kind: "confirm", payment: unconfirmed };
  const reviewed = new Set(reviews.map((r) => r.resumeId));
  const paid = new Set(payments.map((p) => p.resumeId));
  const waiting = resumes.find((r) => r.extractionStatus !== "failed" && !reviewed.has(r.id) && !paid.has(r.id));
  if (waiting) return { kind: "pay", resume: waiting };
  if (reviews[0]) return { kind: "latest", review: reviews[0] };
  return { kind: "upload" };
}

function ActionCard({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-brand-600" aria-hidden />
      <CardBody>
        <p className="eyebrow text-brand-700">Next step</p>
        <div className="mt-3 flex items-start gap-4">
          <IconTile>{icon}</IconTile>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
          </div>
        </div>
        <div className="mt-5">{action}</div>
      </CardBody>
    </Card>
  );
}

function NextActionCard({ next }: { next: NextAction }) {
  switch (next.kind) {
    case "start":
      return (
        <ActionCard icon={<Sparkles />} title="Your paid review is ready" action={<StartReviewButton paymentId={next.payment.id} embedded />}>
          Your payment was verified. Start the review whenever you&apos;re ready.
        </ActionCard>
      );
    case "confirm":
      return (
        <ActionCard
          icon={<CreditCard />}
          title="Confirm your payment"
          action={
            <LinkButton href={`/dashboard/payments/callback?reference=${encodeURIComponent(next.payment.reference!)}`}>Confirm payment</LinkButton>
          }
        >
          You started a checkout that hasn&apos;t been confirmed yet. If you paid, confirm it to unlock your review.
        </ActionCard>
      );
    case "pay":
      return (
        <ActionCard icon={<FileText />} title="Get your resume reviewed" action={<LinkButton href={`/dashboard/resumes/${next.resume.id}`}>Review this resume</LinkButton>}>
          <span className="font-medium text-slate-900">{next.resume.fileName}</span> is uploaded and ready for an automated assessment.
        </ActionCard>
      );
    case "latest":
      return (
        <ActionCard
          icon={<ClipboardList />}
          title="Improve and review again"
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href={`/dashboard/reviews/${next.review.id}`}>Open latest review</LinkButton>
              <LinkButton href="/dashboard/resumes" variant="outline">
                Upload a new version
              </LinkButton>
            </div>
          }
        >
          Work through your recommendations, then upload the updated PDF to see how your score changes.
        </ActionCard>
      );
    default:
      return (
        <ActionCard icon={<FileUp />} title="Upload your resume" action={<LinkButton href="/dashboard/resumes">Upload a PDF</LinkButton>}>
          Start with a text-based PDF (up to 5 MB). You&apos;ll see the price before you pay.
        </ActionCard>
      );
  }
}

export function DashboardOverview() {
  const { state } = useCandidateAuth();
  const resumes = useApi((t) => api.listResumes(t));
  const reviews = useApi((t) => api.listReviews(t));
  const payments = useApi((t) => api.listPayments(t));
  const latest = reviews.data?.items.find((r) => r.status === "completed") ?? reviews.data?.items[0] ?? null;
  const firstName = (state.status === "authenticated" ? state.user.name : null)?.split(" ")[0];
  const loaded = resumes.data && reviews.data && payments.data;
  const error = resumes.error ?? reviews.error ?? payments.error;

  return (
    <>
      <PageHeader
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        description="Upload your resume, get a rule-based assessment and track your progress."
        actions={<LinkButton href="/dashboard/resumes">Upload a resume</LinkButton>}
      />

      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat label="Resumes" icon={<FileText />} value={resumes.data ? resumes.data.total : <Skeleton className="h-8 w-10" />} />
        <Stat label="Reviews" icon={<ClipboardList />} value={reviews.data ? reviews.data.total : <Skeleton className="h-8 w-10" />} />
        <div className="col-span-2 lg:col-span-1">
          <Stat
            label="Latest score"
            icon={<Gauge />}
            value={reviews.loading ? <Skeleton className="h-8 w-14" /> : latest?.overallScore != null ? `${Math.round(latest.overallScore)}/100` : "—"}
            hint={latest?.createdAt ? formatDate(latest.createdAt) : undefined}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {loaded ? (
          <NextActionCard next={pickNextAction(resumes.data!.items, reviews.data!.items, payments.data!.items)} />
        ) : error ? null : (
          <Skeleton className="h-52" />
        )}

        <Card>
          <CardBody className="flex h-full flex-col">
            <p className="eyebrow">Latest review</p>
            {reviews.loading ? (
              <Skeleton className="mt-4 h-40" />
            ) : latest ? (
              <>
                {/* Stacked and centred so long file names wrap instead of being cut off beside the ring. */}
                <div className="mt-5 flex flex-col items-center text-center">
                  {latest.status === "completed" && latest.overallScore !== null ? (
                    <ScoreRing score={latest.overallScore} max={latest.overallMax ?? 100} size="md" />
                  ) : (
                    <ReviewStatusBadge status={latest.status} />
                  )}
                  <p className="mt-4 line-clamp-2 max-w-full font-medium wrap-anywhere text-slate-900" title={latest.resumeName ?? undefined}>
                    {latest.resumeName ? <BreakableText text={latest.resumeName} /> : "Resume review"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(latest.createdAt)}</p>
                </div>
                <div className="mt-auto pt-5">
                  <Link href={`/dashboard/reviews/${latest.id}`} className={buttonClass("outline", "sm", "w-full")}>
                    Open review <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-600">No reviews yet. Your first assessment will appear here.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
