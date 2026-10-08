import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { StoryForm } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "New success story" };

export default async function NewStoryPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/stories" className="text-sm text-slate-500 hover:text-slate-900">← Stories</Link>
      <PageHeader title="New success story" description="Stories start as pending. Approve only after consent and verification." />
      <Card>
        <CardBody>
          <StoryForm story={{}} />
        </CardBody>
      </Card>
    </>
  );
}
