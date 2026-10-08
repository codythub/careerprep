import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { publicStories } from "@/server/services/social-proof";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Verified Success Stories",
  description: "Real, verified journeys from customers who used our services — published only with their consent.",
  alternates: { canonical: "/success-stories" },
};

export default async function SuccessStoriesPage() {
  const stories = await publicStories();
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Verified success stories</h1>
        <p className="mt-2 text-slate-600">
          Every story here is from a real customer, verified by our team and published with their consent. Individual results
          vary — these are journeys, not guarantees.
        </p>
      </div>
      <div className="mt-10">
        {stories.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="No stories published yet"
            action={<LinkButton href="/resume-optimization">Explore resume reviews</LinkButton>}
          >
            We only publish outcomes we&apos;ve verified with real customers, with their permission. We&apos;d rather show nothing
            than show something made up.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((s) => (
              <Link key={s.id} href={`/success-stories/${s.slug}`} className="flex flex-col card border-t-4 border-t-violet-500 p-6 card-hover">
                <p className="text-xs font-semibold text-violet-700">{s.careerField}</p>
                <h2 className="mt-2 text-lg font-semibold">{s.candidateName}</h2>
                <p className="mt-1 text-sm text-slate-500">{s.serviceUsed}</p>
                <p className="mt-3 line-clamp-4 flex-1 text-sm text-slate-600">{s.outcome}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="size-4" aria-hidden /> Verified
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
