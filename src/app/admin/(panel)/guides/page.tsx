import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { GUIDE_CATEGORY_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Career Guides" };

export default async function AdminGuidesPage() {
  await requireAdmin();
  const articles = await db.article.findMany({ orderBy: { updatedAt: "desc" }, include: { author: { select: { name: true, email: true } } } });
  return (
    <>
      <PageHeader title="Career Guides" actions={<LinkButton href="/admin/guides/new">New article</LinkButton>} />
      {articles.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-5" />} title="No articles yet" action={<LinkButton href="/admin/guides/new">Write the first article</LinkButton>} />
      ) : (
        <TableWrap>
          <thead>
            <tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th><th>Author</th></tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/guides/${a.id}`} className="font-medium text-brand-700 hover:underline">{a.title}</Link></td>
                <td>{GUIDE_CATEGORY_LABEL[a.category]}</td>
                <td><Badge tone={a.status === "PUBLISHED" ? "success" : "neutral"}>{a.status}</Badge></td>
                <td className="whitespace-nowrap">{formatDate(a.publishedAt)}</td>
                <td>{a.author.name ?? a.author.email}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
