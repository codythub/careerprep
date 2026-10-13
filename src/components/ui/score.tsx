import type { CSSProperties } from "react";
import { cn } from "@/lib/format";

/** Colour band for a score as a share of its maximum (semantic, not brand). */
export function scoreBand(score: number, max = 100) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return { bar: "bg-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50 ring-emerald-200", label: "Strong" };
  if (pct >= 0.5) return { bar: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50 ring-amber-200", label: "Fair" };
  return { bar: "bg-rose-500", text: "text-rose-700", soft: "bg-rose-50 ring-rose-200", label: "Needs work" };
}

const clampPct = (score: number, max: number) => Math.max(0, Math.min(100, max > 0 ? (score / max) * 100 : 0));

/**
 * Circular score. The ring fills from 0 on mount with CSS only (registered `--score`
 * property), so there is no JavaScript animation and reduced-motion users see the final state.
 */
export function ScoreRing({ score, max = 100, size = "lg" }: { score: number; max?: number; size?: "md" | "lg" }) {
  const b = scoreBand(score, max);
  return (
    <div
      className={cn("score-ring relative flex items-center justify-center rounded-full", b.text, size === "lg" ? "size-44" : "size-28")}
      style={{ "--score": clampPct(score, max) } as CSSProperties}
      role="img"
      aria-label={`Overall score ${Math.round(score)} out of ${max}`}
    >
      <span className={cn("flex flex-col items-center justify-center rounded-full bg-white", size === "lg" ? "size-36" : "size-22")}>
        <span className={cn("font-semibold tabular-nums", b.text, size === "lg" ? "text-5xl" : "text-3xl")}>{Math.round(score)}</span>
        <span className="text-xs font-medium text-slate-500">out of {max}</span>
      </span>
    </div>
  );
}

/** Labelled horizontal bar for one category score; fills from 0 on mount (CSS). */
export function CategoryBar({ name, score, max = 100, delayMs = 0 }: { name: string; score: number; max?: number; delayMs?: number }) {
  const b = scoreBand(score, max);
  const pct = clampPct(score, max);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{name}</span>
        <span className={cn("font-semibold tabular-nums", b.text)}>
          {Math.round(score)}
          <span className="font-normal text-slate-400">/{max}</span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className={cn("bar-fill h-full rounded-full", b.bar)} style={{ width: `${pct}%`, animationDelay: `${delayMs}ms` }} />
      </div>
    </div>
  );
}
