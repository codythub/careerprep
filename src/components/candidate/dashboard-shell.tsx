"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/side-nav";
import { CandidateAuthProvider, RequireCandidate, useCandidateAuth } from "@/components/candidate/auth";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", exact: true },
  { href: "/dashboard/resumes", label: "My Resumes", icon: "FileText" },
  { href: "/dashboard/reviews", label: "Review History", icon: "ClipboardList" },
  { href: "/dashboard/profile", label: "Profile", icon: "User" },
];

export function CandidateDashboardShell({ children }: { children: ReactNode }) {
  return (
    <CandidateAuthProvider>
      <RequireCandidate>{({ user }) => <Shell user={user}>{children}</Shell>}</RequireCandidate>
    </CandidateAuthProvider>
  );
}

function Shell({ user, children }: { user: { name: string | null; email: string | null }; children: ReactNode }) {
  const { signOut } = useCandidateAuth();
  return (
    <AppShell
      nav={NAV}
      navLabel="Dashboard"
      user={{ name: user.name, email: user.email }}
      homeHref="/"
      extraLink={{ href: "/career-guides", label: "Career guides" }}
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
