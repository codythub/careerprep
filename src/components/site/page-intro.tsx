import type { ReactNode } from "react";

/** Standard intro for secondary public pages: eyebrow, title, lead and optional actions. */
export function PageIntro({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className="border-b border-line">
      <div className="container-page py-12 sm:py-16">
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow text-brand-700">{eyebrow}</p>}
          <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-5xl">{title}</h1>
          {children && <div className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{children}</div>}
          {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
