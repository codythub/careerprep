"use client";

import { useCallback, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/laravel/client";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/side-nav";
import { LinkButton } from "@/components/ui/button";
import { CandidateAuthProvider, RequireCandidate, useCandidateAuth } from "@/components/candidate/auth";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "BarChart3", exact: true },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/payments", label: "Payments", icon: "CreditCard" },
  { href: "/admin/reviews", label: "Reviews", icon: "ClipboardList" },
  { href: "/admin/resumes", label: "Resumes", icon: "FileText" },
  { href: "/admin/audit-log", label: "Audit log", shortLabel: "Audit", icon: "ScrollText" },
];

/**
 * Admin area. Same Laravel session as the candidate dashboard; the `role` from GET /auth/user
 * only decides what to render. Laravel re-checks the role on every admin request (403 otherwise).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <CandidateAuthProvider>
      <RequireCandidate>{({ user }) => (user.role === "admin" ? <Shell user={user}>{children}</Shell> : <NoAccess />)}</RequireCandidate>
    </CandidateAuthProvider>
  );
}

function Shell({ user, children }: { user: { name: string | null; email: string | null; role: "candidate" | "admin" }; children: ReactNode }) {
  const { signOut } = useCandidateAuth();
  return (
    <AppShell nav={NAV} navLabel="Admin" user={user} onSignOut={signOut} area="admin">
      {children}
    </AppShell>
  );
}

function NoAccess() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold">You don&apos;t have access to the admin area</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">This area is for CareerPrep staff. If you think this is wrong, contact your administrator.</p>
        <LinkButton href="/dashboard" className="mt-6">
          Go to my dashboard
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * Run an admin write with the session token. A 401 sends the admin to sign in; other errors are
 * rethrown with Laravel's most specific message (a 422 field error when present).
 */
export function useAdminRunner() {
  const { state, handleUnauthorized } = useCandidateAuth();
  const token = state.status === "authenticated" ? state.token : null;
  return useCallback(
    async <T,>(task: (token: string) => Promise<T>, field?: string): Promise<T> => {
      if (!token) {
        handleUnauthorized();
        throw new Error("Please sign in again.");
      }
      try {
        return await task(token);
      } catch (err) {
        if (err instanceof ApiError && err.isUnauthorized) handleUnauthorized();
        if (err instanceof ApiError) {
          const fieldMessage = (field && err.fieldErrors[field]?.[0]) || Object.values(err.fieldErrors)[0]?.[0];
          throw new Error(fieldMessage ?? err.message);
        }
        throw err;
      }
    },
    [token, handleUnauthorized],
  );
}
