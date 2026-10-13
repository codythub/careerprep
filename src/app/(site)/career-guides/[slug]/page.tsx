import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { GUIDE_CATEGORY_LABEL, GUIDE_CATEGORY_SLUG, guideBySlug, listGuides } from "@/content/guides";
import { Markdown } from "@/components/ui/markdown";
import { LinkButton } from "@/components/ui/button";

export const dynamicParams = false;

export function generateStaticParams() {
  return listGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/career-guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = guideBySlug(slug);
  if (!a) return { title: "Guide not found", robots: { index: false } };
  const title = a.seoTitle ?? a.title;
  const description = a.seoDescription ?? a.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/career-guides/${a.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/career-guides/${a.slug}`,
    },
  };
}

export default async function GuidePage({ params }: PageProps<"/career-guides/[slug]">) {
  const { slug } = await params;
  const a = guideBySlug(slug);
  if (!a) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: `${siteConfig.url}/career-guides/${a.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="border-b border-line">
        <div className="container-page py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
              <Link href="/career-guides" className="hover:text-slate-900">
                Career guides
              </Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <Link href={`/career-guides?category=${GUIDE_CATEGORY_SLUG[a.category]}`} className="hover:text-slate-900">
                {GUIDE_CATEGORY_LABEL[a.category]}
              </Link>
            </nav>
            <h1 className="mt-5 text-3xl leading-tight font-semibold sm:text-5xl">{a.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{a.excerpt}</p>
            <p className="mt-4 text-sm text-slate-500">{siteConfig.name}</p>
          </div>
        </div>
      </section>
      <div className="container-page py-10 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <Markdown>{a.content}</Markdown>
          <div className="mt-12 rounded-2xl bg-brand-600 p-6 sm:p-8">
            <p className="text-lg font-semibold text-white">{siteConfig.brandMessage}</p>
            <p className="mt-1 text-sm text-brand-50">Get an automated assessment of your resume with practical recommendations.</p>
            <LinkButton href="/resume-optimization" variant="inverse" className="mt-5">
              Review my resume
            </LinkButton>
          </div>
        </article>
      </div>
    </>
  );
}
