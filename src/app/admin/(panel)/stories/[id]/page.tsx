import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Alert, Badge, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { OpButton, StoryForm } from "@/components/admin/admin-forms";
import { moderateStoryAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Edit success story" };

export default async function EditStoryPage({ params, searchParams }: PageProps<"/admin/stories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const story = await db.successStory.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  if (!story) notFound();
  return (
    <>
      <Link href="/admin/stories" className="text-sm text-slate-500 hover:text-slate-900">← Stories</Link>
      <PageHeader
        title={story.candidateName}
        description={<><Badge tone={story.status === "APPROVED" ? "success" : "warning"}>{story.status}</Badge></>}
        actions={
          <>
            {story.status === "APPROVED" && (
              <Link href={`/success-stories/${story.slug}`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">View live</Link>
            )}
            {story.status !== "APPROVED" && <OpButton action={moderateStoryAction} fields={{ id, op: "approve" }} variant="primary">Approve &amp; publish</OpButton>}
            {story.status !== "REJECTED" && <OpButton action={moderateStoryAction} fields={{ id, op: "reject" }}>Reject</OpButton>}
            {story.status === "APPROVED" && (
              <OpButton action={moderateStoryAction} fields={{ id, op: story.isFeatured ? "unfeature" : "feature" }}>{story.isFeatured ? "Unfeature" : "Feature"}</OpButton>
            )}
            <OpButton action={moderateStoryAction} fields={{ id, op: "delete" }} variant="danger" confirm="Delete this story?">Delete</OpButton>
          </>
        }
      />
      {sp.created === "1" && <Alert tone="success" className="mb-4">Story created as pending.</Alert>}
      <Alert tone="info" className="mb-6" title="Publication requirements">
        Linked customer account with a paid order · written consent recorded · outcome verified. Approval is refused until all three are met.
      </Alert>
      <Card>
        <CardBody>
          <StoryForm story={{ ...story, userEmail: story.user?.email ?? null }} />
        </CardBody>
      </Card>
    </>
  );
}
