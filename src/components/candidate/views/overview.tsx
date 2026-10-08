"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, FileText, FileUp, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, PageHeader, StatCard } from "@/components/ui/primitives";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { useApi, useCandidateAuth } from "@/components/candidate/auth";
import { Loading } from "@/components/candidate/views/loading";

const STEPS = [
  { icon: FileUp, title: "Upload your PDF", body: "Add your current resume (PDF, up to 5 MB)." },
  { icon: CreditCard, title: "Pay securely", body: "Checkout with Paystack. We confirm the payment before your review unlocks." },
  { icon: Sparkles, title: "Get your assessment", body: "See your scores, weaknesses and practical recommendations." },
];

export function DashboardOverview() {
  const { state } = useCandidateAuth();
  const resumes = useApi((t) => api.listResumes(t));
  const reviews = useApi((t) => api.listReviews(t));
  const latest = reviews.data?.items[0] ?? null;
  const name = state.status === "authenticated" ? state.user.name : null;
  const firstName = name?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome${firstName ? `, ${firstName}` : ""}`}
        description="Upload your resume, get a rule-based assessment and track your progress."
        actions={<LinkButton href="/dashboard/resumes">Upload a resume</LinkButton>}
      />

      {(resumes.error || reviews.error) && (
        <Alert tone="error" className="mb-6">
          {resumes.error ?? reviews.error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard accentIndex={0} label="Uploaded resumes" value={resumes.data ? resumes.data.total : "—"} />
        <StatCard accentIndex={1} label="Reviews" value={reviews.data ? reviews.data.total : "—"} />
        <StatCard accentIndex={2} label="Latest score" value={latest?.overallScore != null ? Math.round(latest.overallScore) : "—"} />
      </div>

      {reviews.loading ? (
        <Loading />
      ) : latest ? (
        <Card className="mt-6">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">Latest review · {formatDate(latest.createdAt)}</p>
              <p className="mt-1 truncate font-semibold">{latest.resumeName ?? "Resume review"}</p>
              <div className="mt-2 flex items-center gap-2">
                <ReviewStatusBadge status={latest.status} />
                {latest.status === "completed" && <ScorePill score={latest.overallScore} max={latest.overallMax} />}
              </div>
            </div>
            <LinkButton href={`/dashboard/reviews/${latest.id}`} variant="outline">
              Open review <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          </CardBody>
        </Card>
      ) : (
        !reviews.error && (
          <Card className="mt-6">
            <CardBody>
              <h2 className="font-semibold">How it works</h2>
              <ol className="mt-4 grid gap-4 sm:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${["bg-emerald-600", "bg-sky-600", "bg-amber-500"][i]}`}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <LinkButton href="/dashboard/resumes" className="mt-6">
                Get started
              </LinkButton>
            </CardBody>
          </Card>
        )
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/resumes", label: "My resumes", icon: FileText },
          { href: "/dashboard/reviews", label: "Review history", icon: Sparkles },
          { href: "/dashboard/profile", label: "Profile", icon: FileUp },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center justify-between gap-3 card card-hover p-4 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Icon className="size-4 text-brand-700" aria-hidden /> {label}
            </span>
            <ArrowRight className="size-4 text-slate-400" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  );
}
