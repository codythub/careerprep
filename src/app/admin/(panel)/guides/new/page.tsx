import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { ArticleForm } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/guides" className="text-sm text-slate-500 hover:text-slate-900">← Career guides</Link>
      <PageHeader title="New article" description="Write in Markdown. Raw HTML is not rendered." />
      <Card>
        <CardBody>
          <ArticleForm article={{}} />
        </CardBody>
      </Card>
    </>
  );
}
