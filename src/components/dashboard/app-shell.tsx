import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { BottomTabs, SideNav, type NavItem } from "@/components/dashboard/side-nav";
import { UserMenu } from "@/components/dashboard/user-menu";

/**
 * Candidate dashboard shell: sidebar on desktop; top bar plus bottom tab bar on mobile.
 */
export function AppShell({
  nav,
  navLabel,
  user,
  children,
  onSignOut,
}: {
  nav: NavItem[];
  navLabel: string;
  user: { name: string | null; email: string | null };
  children: ReactNode;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex h-16 items-center px-5">
          <Logo href="/" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="eyebrow px-3 pb-2">Menu</p>
          <SideNav items={nav} label={navLabel} />
        </div>
        <div className="border-t border-line p-3">
          <Link href="/career-guides" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-surface-2 hover:text-slate-950">
            <BookOpen className="size-[18px] text-slate-400" aria-hidden /> Career guides
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:justify-end lg:px-8">
            <Logo href="/" className="lg:hidden" />
            <UserMenu user={user} onSignOut={onSignOut} />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>

      <BottomTabs items={nav} label={`${navLabel} (mobile)`} />
    </div>
  );
}
