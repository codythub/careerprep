import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InterviewPrepContent } from "@/components/site/interview-prep-content";
import { PageIntro } from "@/components/site/page-intro";
import { listGuides } from "@/content/guides";

export const metadata: Metadata = {
  title: "Interview Preparation",
  description: "A practical interview preparation checklist: research, STAR answers, common questions, remote interview setup and follow-up.",
  alternates: { canonical: "/interview-preparation" },
};

export default function InterviewPreparationPage() {
  const guides = listGuides("INTERVIEWS", 6);
  return (
    <>
      <PageIntro eyebrow="Interview preparation" title="Walk into interviews prepared">
        A simple, repeatable routine for every interview — from first screening call to final round.
      </PageIntro>
      <div className="container-page py-10 sm:py-14">
        <InterviewPrepContent />
        {guides.length > 0 && (
          <section className="mt-14">
            <p className="eyebrow">Interview guides</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link href={`/career-guides/${g.slug}`} className="card card-hover flex items-center justify-between gap-3 p-4">
                    <span className="font-medium">{g.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
