import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { OpButton, TestimonialImageForm } from "@/components/admin/admin-forms";
import { moderateTestimonialAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const items = await db.testimonial.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { order: { select: { id: true, orderNumber: true, status: true } }, user: { select: { email: true } } },
    take: 100,
  });
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Submitted by customers from completed orders. Only approved testimonials with consent appear on the website."
      />
      {items.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote className="size-5" />} title="No testimonials yet">
          Customers can submit a testimonial from their order page once it&apos;s delivered.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {items.map((t) => (
            <li key={t.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={t.status === "APPROVED" ? "success" : t.status === "PENDING" ? "warning" : "neutral"}>{t.status}</Badge>
                {t.isVerified && <Badge tone="brand">Verified order</Badge>}
                {t.isFeatured && <Badge tone="accent">Featured</Badge>}
                {!t.consentToPublish && <Badge tone="danger">No consent</Badge>}
              </div>
              <blockquote className="mt-3 text-slate-800">“{t.content}”</blockquote>
              <p className="mt-2 text-sm text-slate-600">
                — {t.name}
                {t.jobTitle && `, ${t.jobTitle}`}
                {t.company && `, ${t.company}`} · {formatDate(t.date)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t.user?.email ?? "deleted user"}
                {t.order && (
                  <>
                    {" · "}
                    <Link href={`/admin/orders/${t.order.id}`} className="text-brand-700 underline">{t.order.orderNumber}</Link> ({t.order.status})
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.status !== "APPROVED" && <OpButton action={moderateTestimonialAction} fields={{ id: t.id, op: "approve" }} variant="primary">Approve</OpButton>}
                {t.status !== "REJECTED" && <OpButton action={moderateTestimonialAction} fields={{ id: t.id, op: "reject" }}>Reject</OpButton>}
                {t.status === "APPROVED" && (
                  <OpButton action={moderateTestimonialAction} fields={{ id: t.id, op: t.isFeatured ? "unfeature" : "feature" }}>
                    {t.isFeatured ? "Unfeature" : "Feature"}
                  </OpButton>
                )}
                <OpButton action={moderateTestimonialAction} fields={{ id: t.id, op: "delete" }} variant="ghost" confirm="Remove this testimonial permanently?">Remove</OpButton>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <TestimonialImageForm id={t.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
