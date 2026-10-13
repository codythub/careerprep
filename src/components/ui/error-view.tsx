"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

/** User-facing error panel. Never shows stack traces — only a reference digest. */
export function ErrorView({ digest, reset }: { digest?: string; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        We hit an unexpected problem loading this page. Please try again — if it keeps happening, contact support.
      </p>
      {digest && <p className="mt-3 font-mono text-xs text-slate-400">Reference: {digest}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/" className={buttonClass("outline")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
