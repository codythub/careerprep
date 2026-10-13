import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Remote Jobs for Nigerian Professionals",
  description: "Our reviewed remote job board for Nigerian professionals is not open yet. Read our guide to finding legitimate remote jobs from Nigeria.",
  alternates: { canonical: "/jobs" },
  // No listings to index until the job board has a backend.
  robots: { index: false, follow: true },
};

/**
 * The CareerPrep Laravel API has no job endpoints yet, so there are no listings to show.
 * Nothing here is faked: the page says so plainly and points to the guides instead.
 */
export default function JobsPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Remote jobs</h1>
        <p className="mt-2 text-slate-600">
          <strong className="font-semibold text-slate-800">Remote</strong> and{" "}
          <strong className="font-semibold text-slate-800">Nigeria Eligible</strong> are different — when the job board opens,
          we&apos;ll only show Nigeria Eligible where our team has confirmed it.
        </p>
      </div>
      <EmptyState
        icon={<BriefcaseBusiness className="size-5" />}
        title="The job board isn't open yet"
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/career-guides/how-to-find-legitimate-remote-jobs-from-nigeria">Find legitimate remote jobs</LinkButton>
            <LinkButton href="/career-guides/job-scam-awareness" variant="outline">
              Job scam awareness
            </LinkButton>
          </div>
        }
      >
        We&apos;re not publishing job listings yet. In the meantime, our free guides explain how to find and check remote roles
        that accept applicants from Nigeria.
      </EmptyState>
    </div>
  );
}
