/**
 * Staged progress for a resume review. The Laravel review request is synchronous and reports
 * no real progress, so these steps are an honest, approximate walkthrough of what the
 * assessment checks — shown while the single request runs. Edit copy and timing here.
 */
export type StagedProgressConfig = {
  /** Steps in order; each is ticked as the eased percentage passes its share of `holdAt`. */
  steps: string[];
  /** The percentage eases toward this value and holds there until the response arrives. */
  holdAt: number;
  /** Easing time constant (ms): about 63% of `holdAt` is reached after this long. */
  easeMs: number;
  /** Show the progress for at least this long, so a fast response doesn't flash by. */
  minDurationMs: number;
  /** Time spent animating to 100% after the response arrives (overlaps the minimum when possible). */
  finishMs: number;
  /** Short, useful tips rotated while waiting. */
  tips: string[];
  tipIntervalMs: number;
};

export const REVIEW_PROGRESS: StagedProgressConfig = {
  steps: [
    "Reading your resume",
    "Checking contact details",
    "Assessing your summary and experience",
    "Reviewing education and skills",
    "Checking formatting and ATS readiness",
    "Writing your recommendations",
  ],
  holdAt: 90,
  easeMs: 6000,
  minDurationMs: 3000,
  finishMs: 450,
  tips: [
    "Start bullet points with a strong verb: led, built, reduced, launched.",
    "Numbers make impact concrete — add a count, a percentage or a naira value where you can.",
    "Keep contact details at the top: phone, professional email, city and LinkedIn URL.",
    "A two- or three-line summary aimed at one target role beats a generic objective.",
    "Use standard headings like “Experience” and “Education” so screening software can find them.",
    "Tailor your skills section to the language used in the job description.",
  ],
  tipIntervalMs: 6000,
};

export type ProgressPhase = "idle" | "running" | "finishing" | "done" | "error";

/** Eased percentage after `elapsedMs`: rises quickly, then approaches `holdAt` without reaching it. */
export function easedPercent(elapsedMs: number, cfg: Pick<StagedProgressConfig, "holdAt" | "easeMs">): number {
  if (elapsedMs <= 0) return 0;
  return cfg.holdAt * (1 - Math.exp(-elapsedMs / cfg.easeMs));
}

/**
 * Index of the step currently in progress. Step i is done once the percentage passes
 * (i + 1) / n of `holdAt`, so the last step stays active while the request is held.
 * Returns `steps.length` when every step is done (phase finishing/done).
 */
export function activeStepIndex(percent: number, phase: ProgressPhase, stepCount: number, holdAt: number): number {
  if (phase === "finishing" || phase === "done") return stepCount;
  const share = holdAt / stepCount;
  return Math.min(stepCount - 1, Math.floor(percent / share));
}
