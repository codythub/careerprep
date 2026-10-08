import { AlertTriangle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import type { Finding, Review, ReviewStatus } from "@/lib/laravel/types";
import { Badge, Card, CardBody } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

const STATUS: Record<ReviewStatus, { label: string; tone: "neutral" | "info" | "success" | "danger" | "warning" }> = {
  pending: { label: "Queued", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Colour band for a score as a share of its maximum. */
function band(score: number, max: number) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return { bar: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-200 bg-emerald-50" };
  if (pct >= 0.5) return { bar: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-200 bg-amber-50" };
  return { bar: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-200 bg-rose-50" };
}

/** Scores are shown out of the max Laravel sends; when none is sent they are read as percentages (0–100). */
const DEFAULT_MAX = 100;

export function ScorePill({ score, max }: { score: number | null; max?: number | null }) {
  if (score === null) return <span className="text-sm text-slate-400">—</span>;
  const m = max ?? DEFAULT_MAX;
  const b = band(score, m);
  return (
    <span className={cn("inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 tabular-nums", b.ring, b.text)}>
      {Math.round(score)}
      <span className="text-xs font-medium opacity-70">/{m}</span>
    </span>
  );
}

function FindingList({ items, icon, tone }: { items: Finding[]; icon: "warn" | "tip" | "good"; tone: string }) {
  const Icon = icon === "warn" ? AlertTriangle : icon === "tip" ? Lightbulb : CheckCircle2;
  return (
    <ul className="space-y-3">
      {items.map((f, i) => (
        <li key={i} className="flex gap-3">
          <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-slate-900">
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

export function HeuristicDisclaimer() {
  return (
    <p className="flex gap-2 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      This assessment is rule-based guidance generated automatically from your PDF. It is not a real applicant tracking
      system (ATS) score, it does not represent any employer&apos;s view, and it does not guarantee interviews or employment.
    </p>
  );
}

/** Completed review: overall score, category scores, findings and recommendations. */
export function ReviewResults({ review }: { review: Review }) {
  const max = review.overallMax ?? DEFAULT_MAX;
  const overall = review.overallScore;
  const b = overall !== null ? band(overall, max) : null;
  const pct = overall !== null ? Math.max(0, Math.min(100, (overall / max) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-t-4 border-t-emerald-500">
          <CardBody className="flex flex-col items-center text-center">
            <p className="text-sm font-medium text-slate-600">Overall score</p>
            {overall !== null ? (
              <div
                className={cn("mt-4 flex size-40 items-center justify-center rounded-full", b?.text)}
                style={{ background: `conic-gradient(currentColor ${pct * 3.6}deg, rgb(226 232 240) 0deg)` }}
                role="img"
                aria-label={`Overall score ${Math.round(overall)} out of ${max}`}
              >
                <span className="flex size-32 flex-col items-center justify-center rounded-full bg-white">
                  <span className={cn("text-4xl font-semibold tabular-nums", b?.text)}>{Math.round(overall)}</span>
                  <span className="text-sm text-slate-500">out of {max}</span>
                </span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No overall score was returned.</p>
            )}
            {review.assessmentVersion && <p className="mt-4 text-xs text-slate-500">Assessment version {review.assessmentVersion}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-semibold">Category scores</h2>
            {review.categoryScores.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No category scores were returned for this review.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {review.categoryScores.map((c) => {
                  const m = c.max ?? DEFAULT_MAX;
                  const cb = band(c.score, m);
                  const w = Math.max(0, Math.min(100, (c.score / m) * 100));
                  return (
                    <li key={c.name}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium capitalize">{c.name.replace(/[_-]+/g, " ")}</span>
                        <span className={cn("font-semibold tabular-nums", cb.text)}>
                          {Math.round(c.score)}
                          <span className="font-normal text-slate-400">/{m}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full", cb.bar)} style={{ width: `${w}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {review.strengths.length > 0 && (
        <Card className="border-t-4 border-t-teal-500">
          <CardBody>
            <h2 className="font-semibold text-teal-800">What&apos;s working</h2>
            <div className="mt-4">
              <FindingList items={review.strengths} icon="good" tone="text-teal-600" />
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-t-4 border-t-rose-500">
          <CardBody>
            <h2 className="font-semibold text-rose-800">Weaknesses</h2>
            <div className="mt-4">
              {review.weaknesses.length ? (
                <FindingList items={review.weaknesses} icon="warn" tone="text-rose-500" />
              ) : (
                <p className="text-sm text-slate-500">No weaknesses were flagged.</p>
              )}
            </div>
          </CardBody>
        </Card>
        <Card className="border-t-4 border-t-amber-500">
          <CardBody>
            <h2 className="font-semibold text-amber-800">Recommendations</h2>
            <div className="mt-4">
              {review.recommendations.length ? (
                <FindingList items={review.recommendations} icon="tip" tone="text-amber-500" />
              ) : (
                <p className="text-sm text-slate-500">No recommendations were returned.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <HeuristicDisclaimer />
    </div>
  );
}
