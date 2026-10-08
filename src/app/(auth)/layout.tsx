import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md card p-6 sm:p-8">{children}</div>
      </main>
      <footer className="py-6 text-center text-xs text-slate-500">
        <Link href="/privacy" className="hover:text-slate-800">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-slate-800">Terms</Link>
      </footer>
    </div>
  );
}
