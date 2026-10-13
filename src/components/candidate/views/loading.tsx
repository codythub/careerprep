import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/primitives";

/** Inline loading state for dashboard data fetched from Laravel. */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" aria-busy="true">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      <span role="status">{label}</span>
    </div>
  );
}

/** Placeholder rows while a list loads. */
export function ListSkeleton({ rows = 3, label = "Loading…" }: { rows?: number; label?: string }) {
  return (
    <div className="card divide-y divide-line" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );
}
