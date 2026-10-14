"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, ChevronDown, LayoutDashboard, LogOut, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/format";

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? (parts[1]?.[0] ?? "") : "")).toUpperCase();
}

/**
 * Account disclosure menu: avatar button → name/email, profile, guides, sign out.
 * Closes on Escape (returning focus to the button), outside click and navigation.
 */
export function UserMenu({
  user,
  onSignOut,
  area = "candidate",
}: {
  user: { name: string | null; email: string | null; role?: "candidate" | "admin" };
  onSignOut: () => Promise<void>;
  area?: "candidate" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-surface hover:text-slate-950";

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-surface-2"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white" aria-hidden>
          {initials(user.name, user.email)}
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium text-slate-800 sm:block">{user.name ?? user.email}</span>
        <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div id={menuId} className="absolute right-0 z-40 mt-2 w-64 animate-fade-up rounded-xl border border-line bg-white p-1.5 shadow-md">
          <div className="border-b border-line px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold text-slate-950">{user.name ?? "Your account"}</p>
            {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
          </div>
          <ul className="pt-1.5">
            {/* Shown to admins only; Laravel still refuses admin API calls from anyone else. */}
            {user.role === "admin" && (
              <li>
                {area === "admin" ? (
                  <Link href="/dashboard" className={itemCls} onClick={() => setOpen(false)}>
                    <LayoutDashboard className="size-4 text-slate-400" aria-hidden /> Candidate dashboard
                  </Link>
                ) : (
                  <Link href="/admin" className={itemCls} onClick={() => setOpen(false)}>
                    <ShieldCheck className="size-4 text-slate-400" aria-hidden /> Admin panel
                  </Link>
                )}
              </li>
            )}
            <li>
              {/* Each area has its own profile page so admins stay inside the admin shell. */}
              <Link href={area === "admin" ? "/admin/profile" : "/dashboard/profile"} className={itemCls} onClick={() => setOpen(false)}>
                <User className="size-4 text-slate-400" aria-hidden /> Profile
              </Link>
            </li>
            {area === "candidate" && (
              <li>
                <Link href="/career-guides" className={itemCls} onClick={() => setOpen(false)}>
                  <BookOpen className="size-4 text-slate-400" aria-hidden /> Career guides
                </Link>
              </li>
            )}
            <li>
              <button
                type="button"
                className={itemCls}
                disabled={signingOut}
                onClick={() => {
                  setSigningOut(true);
                  void onSignOut();
                }}
              >
                <LogOut className="size-4 text-slate-400" aria-hidden /> {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
