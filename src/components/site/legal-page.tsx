import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow text-brand-700">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>
        </div>
      </section>
      <div className="container-page py-12 sm:py-16">
        <article className="prose-content max-w-3xl">{children}</article>
      </div>
    </>
  );
}
