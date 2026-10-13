"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { activeStepIndex, easedPercent, type ProgressPhase, type StagedProgressConfig } from "@/lib/review-progress";

export type StagedProgress = {
  phase: ProgressPhase;
  percent: number;
  /** Index of the step in progress; equals steps.length once all are done. */
  activeStep: number;
  config: StagedProgressConfig;
  /** True from start until the outcome is known — use it to block double submission. */
  busy: boolean;
  /**
   * Run one request with staged progress around it. Resolves with the task's result after
   * the minimum duration and the finish animation. A second call while busy resolves to
   * `undefined` without running the task.
   */
  run: <T>(task: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const TICK_MS = 150;

/** Honest staged progress around a single request that reports no real progress. */
export function useStagedProgress(config: StagedProgressConfig): StagedProgress {
  const [phase, setPhase] = useState<ProgressPhase>("idle");
  const [percent, setPercent] = useState(0);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearInterval(timer.current);
    };
  }, []);

  const stopTicking = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  };

  const run = useCallback(
    async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
      if (inFlight.current) return undefined;
      inFlight.current = true;
      const started = performance.now();
      setPercent(0);
      setPhase("running");

      // A light tick (not every frame): the bar's CSS width transition smooths between updates.
      timer.current = setInterval(() => {
        if (mounted.current) setPercent(easedPercent(performance.now() - started, config));
      }, TICK_MS);

      try {
        const result = await task();
        // Hold for the minimum duration, but never add delay beyond it (the finish
        // animation overlaps the remaining minimum time when there is any).
        const remaining = config.minDurationMs - (performance.now() - started);
        await sleep(Math.max(0, remaining - config.finishMs));
        stopTicking();
        if (mounted.current) {
          setPhase("finishing");
          setPercent(100);
        }
        await sleep(config.finishMs);
        if (mounted.current) setPhase("done");
        return result;
      } catch (err) {
        stopTicking();
        if (mounted.current) setPhase("error");
        throw err;
      } finally {
        inFlight.current = false;
      }
    },
    [config],
  );

  const reset = useCallback(() => {
    if (inFlight.current) return;
    stopTicking();
    setPhase("idle");
    setPercent(0);
  }, []);

  return {
    phase,
    percent,
    activeStep: activeStepIndex(percent, phase, config.steps.length, config.holdAt),
    config,
    busy: phase === "running" || phase === "finishing",
    run,
    reset,
  };
}
