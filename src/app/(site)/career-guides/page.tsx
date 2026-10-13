import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { GUIDE_CATEGORY_LABEL, GUIDE_CATEGORY_SLUG, listGuides, type GuideCategory } from "@/content/guides";
import { cn } from "@/lib/format";
import { EmptyState, IconTile } from "@/components/ui/primitives";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = {
  title: "Career Guides",
  description: "Practical guides for Nigerian professionals: resumes, interviews, remote jobs, LinkedIn, cover letters, salary, portfolios and job scam awareness.",
  alternates: { canonical: "/career-guides" },
};

const SLUG_TO_CATEGORY = Object.fromEntries(Object.entries(GUIDE_CATEGORY_SLUG).map(([k, v]) => [v, k])) as Record<string, GuideCategory>;

export default async function CareerGuidesPage({ searchParams }: PageProps<"/career-guides">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? SLUG_TO_CATEGORY[sp.category] : undefined;
  const articles = listGuides(category);

  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
      active ? "bg-white text-brand-700 shadow-xs ring-1 ring-line" : "text-slate-600 hover:text-slate-950",
    );

  return (
    <>
      <PageIntro eyebrow="Career guides" title="Practical advice for every stage of your job search">
        Honest, step-by-step guidance on resumes, interviews, LinkedIn and staying safe from job scams.
      </PageIntro>
      <div className="container-page py-10 sm:py-14">
        <nav aria-label="Guide categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
            <Link href="/career-guides" aria-current={!category ? "page" : undefined} className={pill(!category)}>
              All
            </Link>
            {(Object.keys(GUIDE_CATEGORY_LABEL) as GuideCategory[]).map((c) => (
              <Link
                key={c}
                href={`/career-guides?category=${GUIDE_CATEGORY_SLUG[c]}`}
                aria-current={category === c ? "page" : undefined}
                className={pill(category === c)}
              >
                {GUIDE_CATEGORY_LABEL[c]}
              </Link>
            ))}
          </div>
        </nav>
        <div className="mt-8">
          {articles.length === 0 ? (
            <EmptyState icon={<BookOpen />} title="No guides in this category yet">
              We&apos;re writing new guides regularly. Check back soon.
            </EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/career-guides/${a.slug}`}
                    className="tile group flex h-full flex-col p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <IconTile tone="neutral">
                      <BookOpen />
                    </IconTile>
                    <p className="eyebrow mt-4">{GUIDE_CATEGORY_LABEL[a.category]}</p>
                    <h2 className="mt-1.5 leading-snug font-semibold group-hover:text-brand-700">{a.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{a.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
