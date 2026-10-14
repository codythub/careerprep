"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/side-nav";
import { CandidateAuthProvider, RequireCandidate, useCandidateAuth } from "@/components/candidate/auth";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", exact: true },
  { href: "/dashboard/resumes", label: "My resumes", shortLabel: "Resumes", icon: "FileText" },
  { href: "/dashboard/reviews", label: "Review history", shortLabel: "Reviews", icon: "ClipboardList" },
  { href: "/dashboard/profile", label: "Profile", icon: "User" },
];

export function CandidateDashboardShell({ children }: { children: ReactNode }) {
  return (
    <CandidateAuthProvider>
      <RequireCandidate>{({ user }) => (user.role === "admin" ? <RedirectAdmin /> : <Shell user={user}>{children}</Shell>)}</RequireCandidate>
    </CandidateAuthProvider>
  );
}

function Shell({ user, children }: { user: { name: string | null; email: string | null; role: "candidate" | "admin" }; children: ReactNode }) {
  const { signOut } = useCandidateAuth();
  return (
    <AppShell nav={NAV} navLabel="Dashboard" user={{ name: user.name, email: user.email, role: user.role }} onSignOut={signOut}>
      {children}
    </AppShell>
  );
}

/** Admin accounts don't use the candidate dashboard: send them to the admin area instead. */
function RedirectAdmin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface" aria-busy="true">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      <span className="sr-only" role="status">
        Opening the admin area…
      </span>
    </div>
  );
}
