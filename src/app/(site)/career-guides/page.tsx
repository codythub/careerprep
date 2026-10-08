import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { GuideCategory } from "@prisma/client";
import { BookOpen } from "lucide-react";
import { GUIDE_CATEGORY_LABEL, GUIDE_CATEGORY_SLUG } from "@/lib/labels";
import { formatDate, cn } from "@/lib/format";
import { EmptyState } from "@/components/ui/primitives";
import { publishedArticles } from "@/server/services/articles";
import { accent } from "@/lib/accents";

export const metadata: Metadata = {
  title: "Career Guides",
  description: "Practical guides for Nigerian professionals: resumes, interviews, remote jobs, LinkedIn, cover letters, salary, portfolios and job scam awareness.",
  alternates: { canonical: "/career-guides" },
};

const SLUG_TO_CATEGORY = Object.fromEntries(Object.entries(GUIDE_CATEGORY_SLUG).map(([k, v]) => [v, k])) as Record<string, GuideCategory>;

export default async function CareerGuidesPage({ searchParams }: PageProps<"/career-guides">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? SLUG_TO_CATEGORY[sp.category] : undefined;
  const articles = await publishedArticles(category);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Career guides</h1>
        <p className="mt-2 text-slate-600">Practical, honest advice for every stage of your job search.</p>
      </div>
      <nav aria-label="Guide categories" className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/career-guides"
          className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm", !category ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 hover:bg-slate-50")}
        >
          All
        </Link>
        {(Object.keys(GUIDE_CATEGORY_LABEL) as GuideCategory[]).map((c) => (
          <Link
            key={c}
            href={`/career-guides?category=${GUIDE_CATEGORY_SLUG[c]}`}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm", category === c ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 hover:bg-slate-50")}
          >
            {GUIDE_CATEGORY_LABEL[c]}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        {articles.length === 0 ? (
          <EmptyState icon={<BookOpen className="size-5" />} title="No guides in this category yet">
            We&apos;re writing new guides regularly. Check back soon.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <Link key={a.id} href={`/career-guides/${a.slug}`} className={`group flex flex-col overflow-hidden card card-hover border-t-4 ${accent(i).top}`}>
                {a.coverImageUrl && (
                  <Image src={a.coverImageUrl} alt="" width={640} height={320} className="aspect-[2/1] w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className={`text-xs font-semibold ${accent(i).text}`}>{GUIDE_CATEGORY_LABEL[a.category]}</p>
                  <h2 className="mt-2 font-semibold leading-snug group-hover:text-brand-700">{a.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{a.excerpt}</p>
                  <p className="mt-4 text-xs text-slate-500">{formatDate(a.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
