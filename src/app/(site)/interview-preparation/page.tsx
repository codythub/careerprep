import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InterviewPrepContent } from "@/components/site/interview-prep-content";
import { listGuides } from "@/content/guides";

export const metadata: Metadata = {
  title: "Interview Preparation",
  description: "A practical interview preparation checklist: research, STAR answers, common questions, remote interview setup and follow-up.",
  alternates: { canonical: "/interview-preparation" },
};

export default function InterviewPreparationPage() {
  const guides = listGuides("INTERVIEWS", 6);
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-brand-700">Interview preparation</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Walk into interviews prepared</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          A simple, repeatable routine for every interview — from first screening call to final round.
        </p>
      </div>
      <InterviewPrepContent />
      {guides.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Interview guides</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/career-guides/${g.slug}`} className="flex items-center justify-between gap-3 card p-4 card-hover">
                  <span className="font-medium">{g.title}</span>
                  <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
