import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { SideNav, type NavItem } from "@/components/dashboard/side-nav";

/** Shared shell for the user dashboard and admin area. */
export function AppShell({
  nav,
  navLabel,
  user,
  children,
  homeHref,
  extraLink,
  signOutAction,
}: {
  nav: NavItem[];
  navLabel: string;
  user: { name: string | null; email: string | null };
  children: ReactNode;
  homeHref: string;
  extraLink?: { href: string; label: string };
  /** Candidates sign out of Laravel; admins out of the legacy admin session. */
  signOutAction: () => Promise<void>;
}) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo href={homeHref} />
          <div className="flex items-center gap-2 sm:gap-4">
            {extraLink && (
              <Link href={extraLink.href} className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
                {extraLink.label}
              </Link>
            )}
            <span className="hidden max-w-48 truncate text-sm text-slate-600 md:inline" title={user.email ?? undefined}>
              {user.name ?? user.email}
            </span>
            <form action={signOutAction}>
              <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <SideNav items={nav} label={navLabel} />
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
