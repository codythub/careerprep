import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="container-page py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href="/career-guides" className="hover:text-slate-900">Career guides</Link>
          <span aria-hidden> / </span>
          <Link href={`/career-guides?category=${GUIDE_CATEGORY_SLUG[a.category]}`} className="hover:text-slate-900">
            {GUIDE_CATEGORY_LABEL[a.category]}
          </Link>
        </nav>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{a.title}</h1>
        <p className="mt-3 text-lg text-slate-600">{a.excerpt}</p>
        <p className="mt-4 text-sm text-slate-500">{siteConfig.name}</p>
        <Markdown className="mt-8">{a.content}</Markdown>
        <div className="mt-12 card bg-slate-50 p-6">
          <p className="font-semibold">{siteConfig.brandMessage}</p>
          <p className="mt-1 text-sm text-slate-600">Get an automated assessment of your resume with practical recommendations.</p>
          <LinkButton href="/resume-optimization" className="mt-4">
            Review my resume
          </LinkButton>
        </div>
      </article>
    </div>
  );
}
