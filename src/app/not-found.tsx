import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-brand-700">404</p>
          <h1 className="mt-2 text-3xl font-semibold">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-slate-600">It may have been moved, closed or never existed. Jobs are removed once they expire.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={buttonClass("primary")}>Go home</Link>
            <Link href="/jobs" className={buttonClass("outline")}>Browse jobs</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
