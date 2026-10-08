import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="relative isolate flex-1">
        {/* Soft colour wash behind each page's title area (pages with their own hero cover it). */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-amber-50/40 to-transparent" />
          <div className="absolute -top-24 right-0 size-80 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -top-16 left-1/4 size-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute top-10 right-1/3 size-56 rounded-full bg-sky-200/30 blur-3xl" />
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
