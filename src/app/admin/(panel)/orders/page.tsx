import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { cn, formatDate, formatNaira } from "@/lib/format";
import { EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Resume Orders" };
const PAGE = 25;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in ORDER_STATUS_LABEL ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = status ? { status } : {};
  const [total, orders] = await Promise.all([
    db.resumeOrder.count({ where }),
    db.resumeOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { user: { select: { name: true, email: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Resume Orders" description={`${total} order${total === 1 ? "" : "s"}`} />
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
        <Link href="/admin/orders" className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", !status ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>All</Link>
        {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <EmptyState title="No orders found" />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Target role</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap"><Link href={`/admin/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">{o.orderNumber}</Link></td>
                <td><span className="block">{o.user.name ?? "—"}</span><span className="text-xs text-slate-500">{o.user.email}</span></td>
                <td className="max-w-48 truncate">{o.targetRole}</td>
                <td className="tabular-nums">{formatNaira(o.amountKobo)}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="whitespace-nowrap">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} basePath="/admin/orders" params={{ status }} />
    </>
  );
}
