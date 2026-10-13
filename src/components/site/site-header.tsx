"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/format";
import { getToken, onTokenChange } from "@/lib/laravel/token";

const NAV = [
  { href: "/resume-optimization", label: "Resume Review" },
  { href: "/jobs", label: "Remote Jobs" },
  { href: "/career-guides", label: "Career Guides" },
  { href: "/interview-preparation", label: "Interview Prep" },
  { href: "/employers", label: "For Employers" },
];

/**
 * Client header so public pages stay statically cacheable. Candidates are "signed in" when a
 * Laravel bearer token is held in this browser (the dashboard validates it with the API).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // null until mounted: the token lives in browser storage, which the server can't read.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setSignedIn(getToken() !== null);
    check();
    return onTokenChange(check);
  }, []);

  // Close the mobile menu on navigation (render-phase state adjustment).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const account = signedIn ? (
    <Link href="/dashboard" className={buttonClass("outline", "sm")}>
      Dashboard
    </Link>
  ) : (
    <Link href="/login" className={buttonClass("ghost", "sm")}>
      Sign in
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(item.href) ? "text-brand-700" : "text-slate-700 hover:text-slate-950",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {account}
          <Link href="/resume-optimization" className={buttonClass("primary", "sm")}>
            Review My Resume
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-3 text-base font-medium text-slate-800 hover:bg-slate-50">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              {signedIn ? (
                <Link href="/dashboard" className={buttonClass("outline", "md")}>
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className={buttonClass("outline", "md")}>
                  Sign in
                </Link>
              )}
              <Link href="/resume-optimization" className={buttonClass("primary", "md")}>
                Review Resume
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
