import { Loader2 } from "lucide-react";

/** Inline loading state for dashboard data fetched from Laravel. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" aria-busy="true" aria-live="polite">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden /> {label}
    </div>
  );
}
