import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verified Success Stories",
  description: "Real, verified journeys from customers who used our services — published only with their consent.",
  alternates: { canonical: "/success-stories" },
};

/**
 * Stories would come from the backend, but the CareerPrep Laravel API has no success-story
 * endpoint yet. Until it does, the page shows its empty state: nothing is made up.
 */
export default function SuccessStoriesPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Verified success stories</h1>
        <p className="mt-2 text-slate-600">
          Every story here will be from a real customer, verified by our team and published with their consent. Individual
          results vary — these are journeys, not guarantees.
        </p>
      </div>
      <div className="mt-10">
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No stories published yet"
          action={<LinkButton href="/resume-optimization">Explore resume reviews</LinkButton>}
        >
          We only publish outcomes we&apos;ve verified with real customers, with their permission. We&apos;d rather show nothing
          than show something made up.
        </EmptyState>
      </div>
    </div>
  );
}
