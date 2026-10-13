import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { PageIntro } from "@/components/site/page-intro";

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
    <>
      <PageIntro eyebrow="Success stories" title="Verified success stories">
        Every story here will be from a real customer, verified by our team and published with their consent. Individual results vary —
        these are journeys, not guarantees.
      </PageIntro>
      <div className="container-page py-10 sm:py-14">
        <EmptyState icon={<Sparkles />} title="No stories published yet" action={<LinkButton href="/resume-optimization">Explore resume reviews</LinkButton>}>
          We only publish outcomes we&apos;ve verified with real customers, with their permission. We&apos;d rather show nothing than show
          something made up.
        </EmptyState>
      </div>
    </>
  );
}
