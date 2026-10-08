import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Alert, Badge, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { ArticleForm, OpButton } from "@/components/admin/admin-forms";
import { articleStatusAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({ params, searchParams }: PageProps<"/admin/guides/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const a = await db.article.findUnique({ where: { id } });
  if (!a) notFound();
  const published = a.status === "PUBLISHED";
  return (
    <>
      <Link href="/admin/guides" className="text-sm text-slate-500 hover:text-slate-900">← Career guides</Link>
      <PageHeader
        title={a.title}
        description={<Badge tone={published ? "success" : "neutral"}>{a.status}</Badge>}
        actions={
          <>
            {published && (
              <Link href={`/career-guides/${a.slug}`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">View live</Link>
            )}
            <OpButton action={articleStatusAction} fields={{ id, op: published ? "unpublish" : "publish" }} variant={published ? "outline" : "primary"}>
              {published ? "Unpublish" : "Publish"}
            </OpButton>
            <OpButton action={articleStatusAction} fields={{ id, op: "delete" }} variant="danger" confirm="Delete this article?">Delete</OpButton>
          </>
        }
      />
      {sp.created === "1" && <Alert tone="success" className="mb-4">Article saved.</Alert>}
      <Card>
        <CardBody>
          <ArticleForm article={{ ...a, published }} />
        </CardBody>
      </Card>
    </>
  );
}
