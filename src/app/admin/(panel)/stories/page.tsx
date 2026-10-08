import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { LinkButton } from "@/components/ui/button";
import { Badge, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Success Stories" };

export default async function AdminStoriesPage() {
  await requireAdmin();
  const stories = await db.successStory.findMany({ orderBy: { updatedAt: "desc" }, include: { user: { select: { email: true } } } });
  return (
    <>
      <PageHeader
        title="Success Stories"
        description="A story can only be approved when it is linked to a paying customer, has recorded consent and a verified outcome."
        actions={<LinkButton href="/admin/stories/new">New story</LinkButton>}
      />
      {stories.length === 0 ? (
        <EmptyState icon={<Star className="size-5" />} title="No stories yet" action={<LinkButton href="/admin/stories/new">Add a story</LinkButton>}>
          Only add stories from real customers who have agreed to share them.
        </EmptyState>
      ) : (
        <TableWrap>
          <thead>
            <tr><th>Candidate</th><th>Status</th><th>Checks</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {stories.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/stories/${s.id}`} className="font-medium text-brand-700 hover:underline">{s.candidateName}</Link>
                  <span className="block text-xs text-slate-500">{s.careerField} · {s.user?.email ?? "not linked"}</span>
                </td>
                <td><Badge tone={s.status === "APPROVED" ? "success" : s.status === "PENDING" ? "warning" : "neutral"}>{s.status}</Badge></td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={s.consentToPublish ? "success" : "danger"}>{s.consentToPublish ? "Consent" : "No consent"}</Badge>
                    <Badge tone={s.isVerified ? "success" : "danger"}>{s.isVerified ? "Verified" : "Unverified"}</Badge>
                    {s.isFeatured && <Badge tone="accent">Featured</Badge>}
                  </span>
                </td>
                <td className="whitespace-nowrap">{formatDate(s.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
