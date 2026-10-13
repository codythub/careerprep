import type { CSSProperties } from "react";
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import type { Finding, Review, ReviewStatus } from "@/lib/laravel/types";
import { Badge, Card, CardBody } from "@/components/ui/primitives";
import { CategoryBar, ScoreRing, scoreBand } from "@/components/ui/score";
import { cn } from "@/lib/format";

/** Required wording; Laravel's own `disclaimer` is shown instead whenever it is sent. */
export const REVIEW_DISCLAIMER =
  "This automated rule-based review is guidance only. It is not an ATS score and does not guarantee hiring outcomes.";

const STATUS: Record<ReviewStatus, { label: string; tone: "neutral" | "info" | "success" | "danger" | "warning" }> = {
  pending: { label: "Processing", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Scores are shown out of the max Laravel sends; when none is sent they are percentages (0–100). */
const DEFAULT_MAX = 100;

export function ScorePill({ score, max }: { score: number | null; max?: number | null }) {
  if (score === null) return <span className="text-sm text-slate-400">—</span>;
  const m = max ?? DEFAULT_MAX;
  const b = scoreBand(score, m);
  return (
    <span className={cn("inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ring-1", b.soft, b.text)}>
      {Math.round(score)}
      <span className="text-xs font-medium opacity-70">/{m}</span>
    </span>
  );
}

const humanise = (slug: string) => {
  const s = slug.replace(/[_-]+/g, " ").trim().replace(/\bats\b/gi, "ATS");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Staggered reveal: each item fades up a little after the previous one. */
const stagger = (i: number, baseMs = 0): CSSProperties => ({ animationDelay: `${baseMs + i * 70}ms` });

function FindingList({ items, kind, baseDelay }: { items: Finding[]; kind: "weakness" | "recommendation"; baseDelay: number }) {
  const Icon = kind === "weakness" ? AlertTriangle : Lightbulb;
  return (
    <ul className="space-y-3">
      {items.map((f, i) => (
        <li key={i} className="flex animate-fade-up gap-3 rounded-xl bg-surface p-3.5" style={stagger(i, baseDelay)}>
          <Icon className={cn("mt-0.5 size-4 shrink-0", kind === "weakness" ? "text-rose-500" : "text-amber-500")} aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="leading-relaxed font-medium text-slate-900">
              {f.title}
              {f.category && <span className="ml-2 text-xs font-normal text-slate-500">{f.category}</span>}
            </p>
            {f.detail && <p className="mt-0.5 leading-relaxed text-slate-600">{f.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HeuristicDisclaimer({ text }: { text?: string | null }) {
  return (
    <p className="flex gap-2.5 rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-slate-600">
      <Info className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
      {text ?? REVIEW_DISCLAIMER}
    </p>
  );
}

/** Completed review: score ring, category bars, weaknesses and recommendations (animated in on mount). */
export function ReviewResults({ review }: { review: Review }) {
  const max = review.overallMax ?? DEFAULT_MAX;
  const overall = review.overallScore;
  const band = overall !== null ? scoreBand(overall, max) : null;
  const categories = [...review.categoryScores].sort((a, b) => a.score / (a.max ?? DEFAULT_MAX) - b.score / (b.max ?? DEFAULT_MAX));
  const weakest = categories[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="animate-fade-up">
          <CardBody className="flex flex-col items-center text-center">
            <p className="eyebrow">Overall score</p>
            {overall !== null ? (
              <>
                <div className="mt-5">
                  <ScoreRing score={overall} max={max} />
                </div>
                {band && <Badge tone={band.label === "Strong" ? "success" : band.label === "Fair" ? "warning" : "danger"} className="mt-5">{band.label}</Badge>}
                {weakest && (
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Biggest opportunity: <strong className="font-semibold text-slate-900">{humanise(weakest.name)}</strong>
                  </p>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No overall score was returned.</p>
            )}
            {review.assessmentVersion && <p className="mt-4 text-xs text-slate-400">Assessment {review.assessmentVersion}</p>}
          </CardBody>
        </Card>

        <Card className="animate-fade-up" style={stagger(1)}>
          <CardBody>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">Category breakdown</h2>
              <p className="text-xs text-slate-500">Lowest first</p>
            </div>
            {categories.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No category scores were returned for this review.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {categories.map((c, i) => (
                  <li key={c.name}>
                    <CategoryBar name={humanise(c.name)} score={c.score} max={c.max ?? DEFAULT_MAX} delayMs={150 + i * 60} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {review.strengths.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> What&apos;s working
            </h2>
            <ul className="mt-4 space-y-2">
              {review.strengths.map((f, i) => (
                <li key={i} className="animate-fade-up text-sm text-slate-700" style={stagger(i, 200)}>
                  {f.title}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-rose-500" aria-hidden /> Weaknesses
              <span className="ml-auto text-xs font-medium text-slate-500">{review.weaknesses.length}</span>
            </h2>
            <div className="mt-4">
              {review.weaknesses.length ? (
                <FindingList items={review.weaknesses} kind="weakness" baseDelay={300} />
              ) : (
                <p className="text-sm text-slate-500">No weaknesses were flagged.</p>
              )}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="flex items-center gap-2 font-semibold">
              <Lightbulb className="size-4 text-amber-500" aria-hidden /> Recommendations
              <span className="ml-auto text-xs font-medium text-slate-500">{review.recommendations.length}</span>
            </h2>
            <div className="mt-4">
              {review.recommendations.length ? (
                <FindingList items={review.recommendations} kind="recommendation" baseDelay={400} />
              ) : (
                <p className="text-sm text-slate-500">No recommendations were returned.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <HeuristicDisclaimer text={review.disclaimer} />
    </div>
  );
}
