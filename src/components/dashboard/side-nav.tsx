"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  MessagesSquare,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/format";

// Icons are referenced by name: component functions can't cross the server→client boundary.
const ICONS = {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  MessagesSquare,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; exact?: boolean };

/** Vertical nav on desktop, horizontally scrollable pill nav on mobile. */
export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
  return (
    <nav aria-label={label}>
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
                {!!item.badge && (
                  <span className="ml-auto rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">{item.badge}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
