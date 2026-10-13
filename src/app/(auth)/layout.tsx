import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:py-10">
        <div className="w-full max-w-md">
          <div className="card p-6 shadow-sm sm:p-8">{children}</div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Lock className="size-3.5" aria-hidden /> Your resumes are stored privately and never shared.
          </p>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-slate-500">
        <Link href="/privacy" className="hover:text-slate-800">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-slate-800">
          Terms
        </Link>
      </footer>
    </div>
  );
}
