import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="max-w-md text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs ring-1 ring-line">
            <Compass className="size-5" aria-hidden />
          </span>
          <p className="eyebrow mt-6">Error 404</p>
          <h1 className="mt-2 text-3xl font-semibold">We couldn&apos;t find that page</h1>
          <p className="mt-3 leading-relaxed text-slate-600">It may have been moved, or it never existed.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={buttonClass("primary")}>
              Go home
            </Link>
            <Link href="/career-guides" className={buttonClass("outline")}>
              Career guides
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
