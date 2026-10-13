"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { ProgressBar, Stepper, type StepState } from "@/components/ui/progress";
import type { StagedProgress } from "@/components/candidate/use-staged-progress";

/**
 * Staged review progress (used by Start review, the payment callback and Retry).
 * The percentage and steps are approximate: the review is one synchronous request.
 */
export function ReviewProgress({
  progress,
  title = "Reviewing your resume",
  subtitle,
  embedded,
}: {
  progress: StagedProgress;
  title?: string;
  subtitle?: string;
  /** Inside an existing card: no border, shadow or padding of its own. */
  embedded?: boolean;
}) {
  const { config, percent, activeStep, phase } = progress;
  const done = phase === "finishing" || phase === "done";
  const steps = config.steps.map((label, i): { label: string; state: StepState } => ({
    label,
    state: i < activeStep ? "done" : i === activeStep && !done ? "active" : done ? "done" : "pending",
  }));
  const announcement = done ? "Review complete." : `${config.steps[activeStep] ?? ""}…`;

  return (
    <div className={embedded ? "animate-fade-up text-left" : "animate-fade-up rounded-2xl border border-line bg-white p-5 text-left shadow-sm sm:p-7"}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" aria-hidden>
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">{done ? "Review complete" : title}</h2>
            {subtitle && <p className="text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
          </div>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-brand-700 sm:text-3xl" aria-hidden>
          {Math.round(percent)}%
        </span>
      </div>

      <ProgressBar value={percent} label="Review progress (approximate)" className="mt-5" />
      {/* Step changes only — not every percentage tick — are announced to screen readers. */}
      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>

      <Stepper steps={steps} className="mt-6" />

      {!done && <Tip tips={config.tips} intervalMs={config.tipIntervalMs} />}

      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-slate-500">
        You can leave this page — your review keeps running and will appear in <strong className="font-medium text-slate-700">Review history</strong>.
      </p>
    </div>
  );
}

function Tip({ tips, intervalMs }: { tips: string[]; intervalMs: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (tips.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % tips.length), intervalMs);
    return () => clearInterval(t);
  }, [tips.length, intervalMs]);
  if (!tips.length) return null;
  return (
    <div className="mt-6 flex gap-3 rounded-xl bg-surface p-4">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
      <p key={i} className="animate-fade-up text-sm leading-relaxed text-slate-700">
        <span className="font-semibold text-slate-900">Tip: </span>
        {tips[i]}
      </p>
    </div>
  );
}
