import { describe, expect, it } from "vitest";
import { REVIEW_PROGRESS, activeStepIndex, easedPercent } from "@/lib/review-progress";

const cfg = REVIEW_PROGRESS;
const n = cfg.steps.length;

describe("staged review progress", () => {
  it("eases toward the hold point and never reaches it while waiting", () => {
    expect(easedPercent(0, cfg)).toBe(0);
    const early = easedPercent(3000, cfg);
    const late = easedPercent(60_000, cfg);
    expect(early).toBeGreaterThan(20);
    expect(late).toBeGreaterThan(early);
    expect(late).toBeLessThan(cfg.holdAt);
    expect(easedPercent(10 * 60_000, cfg)).toBeLessThanOrEqual(cfg.holdAt);
  });

  it("keeps the last step active while held, and ticks all steps when finishing", () => {
    expect(activeStepIndex(0, "running", n, cfg.holdAt)).toBe(0);
    expect(activeStepIndex(cfg.holdAt - 0.01, "running", n, cfg.holdAt)).toBe(n - 1);
    expect(activeStepIndex(cfg.holdAt, "running", n, cfg.holdAt)).toBe(n - 1);
    expect(activeStepIndex(100, "finishing", n, cfg.holdAt)).toBe(n);
    expect(activeStepIndex(100, "done", n, cfg.holdAt)).toBe(n);
  });

  it("holds for at least the minimum duration and shows no time estimates", () => {
    expect(cfg.minDurationMs).toBeGreaterThanOrEqual(3000);
    expect(cfg.steps.join(" ")).not.toMatch(/\d+\s*(s|sec|seconds|min|minutes)\b/i);
  });
});
