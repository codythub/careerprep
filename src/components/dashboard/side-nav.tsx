"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, CreditCard, FileText, LayoutDashboard, ScrollText, User, Users } from "lucide-react";
import { cn } from "@/lib/format";

// Icons are referenced by name: component functions can't cross the server→client boundary.
const ICONS = { BarChart3, ClipboardList, CreditCard, FileText, LayoutDashboard, ScrollText, User, Users };

export type NavItem = { href: string; label: string; shortLabel?: string; icon: keyof typeof ICONS; exact?: boolean };

function useIsActive() {
  const pathname = usePathname();
  return (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
}

/** Vertical navigation in the desktop sidebar. */
export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label={label}>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-surface-2 hover:text-slate-950",
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active ? "text-brand-600" : "text-slate-400")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Fixed bottom tab bar on mobile (thumb-reachable, safe-area aware). */
export function BottomTabs({ items, label }: { items: NavItem[]; label: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(item);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 truncate px-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-brand-700" : "text-slate-500 hover:text-slate-900",
                )}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-brand-50")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {item.shortLabel ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
