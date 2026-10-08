import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { DefinitionList } from "@/components/ui/primitives";
import { LinkButton } from "@/components/ui/button";
import { publicStoryWhere } from "@/server/services/social-proof";

export const revalidate = 300;

async function getStory(slug: string) {
  return db.successStory.findFirst({ where: { slug, ...publicStoryWhere } });
}

export async function generateMetadata({ params }: PageProps<"/success-stories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s) return { title: "Story not found", robots: { index: false } };
  return { title: `${s.candidateName}: ${s.careerField}`, description: s.outcome.slice(0, 160), alternates: { canonical: `/success-stories/${s.slug}` } };
}

export default async function StoryPage({ params }: PageProps<"/success-stories/[slug]">) {
  const { slug } = await params;
  const s = await getStory(slug);
  if (!s) notFound();
  const sections: Array<[string, string]> = [
    ["Where they started", s.previousSituation],
    ["What was improved", s.improvements],
    ["The application and interview journey", s.journey],
    ["Outcome", s.outcome],
  ];
  return (
    <div className="container-page py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <Link href="/success-stories" className="text-sm text-slate-500 hover:text-slate-900">
          ← All success stories
        </Link>
        <div className="mt-6 flex items-center gap-4">
          {s.candidateImageUrl && <Image src={s.candidateImageUrl} alt="" width={64} height={64} className="size-16 rounded-full object-cover" />}
          <div>
            <h1 className="text-3xl font-semibold">{s.candidateName}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <BadgeCheck className="size-4" aria-hidden /> Verified customer story · {formatDate(s.publishedAt)}
            </p>
          </div>
        </div>
        <div className="mt-8 card p-5">
          <DefinitionList
            items={[
              ["Career field", s.careerField],
              ["Service used", s.serviceUsed],
              ["Target role", s.targetRole],
              ...(s.newRole ? ([["New role", `${s.newRole}${s.company ? ` at ${s.company}` : ""}`]] as Array<[string, string]>) : []),
            ]}
          />
        </div>
        {sections.map(([title, body]) => (
          <section key={title} className="mt-8">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{body}</p>
          </section>
        ))}
        {s.testimonial && (
          <blockquote className="mt-10 border-l-4 border-brand-600 pl-5 text-lg italic text-slate-700">“{s.testimonial}”</blockquote>
        )}
        <p className="mt-10 text-xs text-slate-500">
          Published with {s.candidateName}&apos;s consent. Individual results vary; our services do not guarantee employment.
        </p>
        <LinkButton href="/resume-optimization" className="mt-6">
          Explore resume reviews
        </LinkButton>
      </article>
    </div>
  );
}
