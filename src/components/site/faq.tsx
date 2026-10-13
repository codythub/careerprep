import type { ReactNode } from "react";

/** FAQ list in the reference style: dark icon square, question, answer. Always expanded (no JS). */
export function FaqList({ items }: { items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <dl className="space-y-3">
      {items.map(({ q, a }) => (
        <div key={q} className="tile flex gap-4 p-4 sm:p-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white" aria-hidden>
            ?
          </span>
          <div className="min-w-0">
            <dt className="font-semibold text-slate-950">{q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{a}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
