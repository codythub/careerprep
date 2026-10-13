import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * Progress bar. Pass `value` (0–100) for determinate progress; omit it for an indeterminate
 * bar (work is happening but its extent is unknown).
 */
export function ProgressBar({ value, label, className }: { value?: number; label: string; className?: string }) {
  const determinate = typeof value === "number";
  const v = determinate ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round(v) : undefined}
      className={cn("relative h-2 overflow-hidden rounded-full bg-surface-2", className)}
    >
      {determinate ? (
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out" style={{ width: `${v}%` }} />
      ) : (
        <div className="absolute inset-y-0 left-0 w-2/5 animate-indeterminate rounded-full bg-brand-600" />
      )}
    </div>
  );
}

export type StepState = "done" | "active" | "pending";

/** Vertical checklist of steps. The active step is marked with aria-current="step". */
export function Stepper({ steps, className }: { steps: Array<{ label: ReactNode; state: StepState }>; className?: string }) {
  return (
    <ol className={cn("space-y-3", className)}>
      {steps.map((s, i) => (
        <li key={i} aria-current={s.state === "active" ? "step" : undefined} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              s.state === "done" && "bg-brand-600 text-white",
              s.state === "active" && "bg-brand-50 text-brand-700 ring-2 ring-brand-200",
              s.state === "pending" && "bg-surface-2 text-slate-400",
            )}
            aria-hidden
          >
            {s.state === "done" ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : s.state === "active" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
          </span>
          <span className={cn("transition-colors duration-300", s.state === "pending" ? "text-slate-500" : "font-medium text-slate-900")}>
            {s.label}
            <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "active" ? " (in progress)" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
