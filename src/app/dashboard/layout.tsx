import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidateDashboardShell } from "@/components/candidate/dashboard-shell";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Dashboard" }, robots: { index: false, follow: false } };

/** Candidate area: the Laravel bearer token lives in the browser, so the guard runs client-side. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <CandidateDashboardShell>{children}</CandidateDashboardShell>
    </Suspense>
  );
}
