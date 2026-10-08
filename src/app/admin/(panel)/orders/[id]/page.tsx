import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EXPERIENCE_LEVEL_LABEL, ORDER_STATUS_LABEL } from "@/lib/labels";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { Badge, Card, CardBody, DefinitionList, PageHeader } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { DeliverableUploadForm, OrderNotesForm, OrderStatusForm } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";
import { ORDER_TRANSITIONS } from "@/server/services/order-status";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.resumeOrder.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, linkedinUrl: true, _count: { select: { orders: true } } } },
      resume: true,
      deliverables: { orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true, email: true } } } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { email: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      assignedTo: { select: { email: true } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-slate-900">← Orders</Link>
      <PageHeader title={order.orderNumber} description={`${order.targetRole} · ${formatNaira(order.amountKobo)}`} actions={<OrderStatusBadge status={order.status} />} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 font-semibold">Order</h2>
              <DefinitionList
                items={[
                  ["Target role", order.targetRole],
                  ["Industry", order.targetIndustry ?? "—"],
                  ["Experience level", order.experienceLevel ? EXPERIENCE_LEVEL_LABEL[order.experienceLevel] : "—"],
                  ["Price (snapshot)", formatNaira(order.amountKobo)],
                  ["Terms accepted", formatDateTime(order.termsAcceptedAt)],
                  ["Paid at", formatDateTime(order.paidAt)],
                  ["Assigned to", order.assignedTo?.email ?? "Unassigned"],
                  ["Delivered at", formatDateTime(order.deliveredAt)],
                ]}
              />
              {order.customerNotes && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Customer notes</p>
                  <p className="mt-1 whitespace-pre-line">{order.customerNotes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-4 font-semibold">Customer</h2>
              <DefinitionList
                items={[
                  ["Name", order.user.name ?? "—"],
                  ["Email", order.user.email],
                  ["Phone", order.user.phone ?? "—"],
                  ["LinkedIn", order.user.linkedinUrl ? <a key="l" href={order.user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">Profile</a> : "—"],
                  ["Total orders", order.user._count.orders],
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-semibold">Files</h2>
              <p className="text-sm">
                Original resume:{" "}
                <a href={`/api/files/resume/${order.resume.id}`} className="font-medium text-brand-700 underline">{order.resume.fileName}</a>{" "}
                <span className="text-slate-500">({Math.round(order.resume.sizeBytes / 1024)} KB)</span>
              </p>
              <h3 className="mt-5 text-sm font-semibold">Final files</h3>
              {order.deliverables.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">None uploaded yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {order.deliverables.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-2">
                      <Badge>{d.type} v{d.version}</Badge>
                      <a href={`/api/files/deliverable/${d.id}`} className="text-brand-700 underline">{d.fileName}</a>
                      <span className="text-xs text-slate-500">{formatDateTime(d.createdAt)} by {d.uploadedBy.email}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <DeliverableUploadForm orderId={order.id} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <OrderNotesForm orderId={order.id} internalNotes={order.internalNotes} profileRecommendations={order.profileRecommendations} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 font-semibold">Status</h2>
              <OrderStatusForm orderId={order.id} allowed={ORDER_TRANSITIONS[order.status]} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h2 className="mb-3 font-semibold">Payments</h2>
              {order.payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payment attempts.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {order.payments.map((p) => (
                    <li key={p.id} className="rounded-lg border border-slate-100 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-xs">{p.reference}</span>
                        <Badge tone={p.status === "SUCCESS" ? "success" : p.status === "PENDING" ? "warning" : "neutral"}>{p.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{formatNaira(p.amountKobo)} · {formatDateTime(p.createdAt)}{p.gatewayResponse ? ` · ${p.gatewayResponse}` : ""}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h2 className="mb-3 font-semibold">History</h2>
              <ol className="space-y-2 text-sm">
                {order.statusHistory.map((h) => (
                  <li key={h.id}>
                    <p className="font-medium">{h.fromStatus ? `${ORDER_STATUS_LABEL[h.fromStatus]} → ` : ""}{ORDER_STATUS_LABEL[h.toStatus]}</p>
                    <p className="text-xs text-slate-500">{formatDate(h.createdAt)} · {h.changedBy?.email ?? "system"}{h.note ? ` · ${h.note}` : ""}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
