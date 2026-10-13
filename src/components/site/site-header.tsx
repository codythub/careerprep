"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/format";
import { getToken, onTokenChange } from "@/lib/laravel/token";

const NAV = [
  { href: "/resume-optimization", label: "Resume Review" },
  { href: "/career-guides", label: "Career Guides" },
  { href: "/interview-preparation", label: "Interview Prep" },
  { href: "/jobs", label: "Jobs" },
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
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

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

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    menuButton.current?.focus();
  }

  /** Escape closes; Tab cycles inside the open panel (focus trap). */
  function onPanelKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") return close();
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>("a,button")];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Dashboard" : "Sign in";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-white text-brand-700 shadow-xs ring-1 ring-line" : "text-slate-600 hover:text-slate-950",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href={accountHref} className={buttonClass(signedIn ? "outline" : "ghost", "sm")}>
            {accountLabel}
          </Link>
          <Link href="/resume-optimization" className={buttonClass("primary", "sm")}>
            Review my resume
          </Link>
        </div>
        <button
          ref={menuButton}
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-surface-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          ref={panel}
          aria-label="Mobile"
          onKeyDown={onPanelKeyDown}
          className="absolute inset-x-0 top-full border-b border-line bg-white shadow-md lg:hidden"
        >
          <div className="container-page flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-base font-medium",
                  isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-slate-800 hover:bg-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4">
              <Link href={accountHref} className={buttonClass("outline", "md")}>
                {accountLabel}
              </Link>
              <Link href="/resume-optimization" className={buttonClass("primary", "md")}>
                Review resume
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
