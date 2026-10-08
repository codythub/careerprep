import type { Metadata } from "next";
import Link from "next/link";
import type { PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { cn, formatDateTime, formatNaira } from "@/lib/format";
import { Badge, EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Payments" };
const PAGE = 30;
const STATUSES: PaymentStatus[] = ["SUCCESS", "PENDING", "FAILED", "ABANDONED", "REFUNDED"];

export default async function PaymentsPage({ searchParams }: PageProps<"/admin/payments">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as PaymentStatus) ? (sp.status as PaymentStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = status ? { status } : {};
  const [total, payments, sum] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { order: { select: { id: true, orderNumber: true } }, user: { select: { email: true } } } }),
    db.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true }, _count: true }),
  ]);
  return (
    <>
      <PageHeader title="Payments" description={`${sum._count} successful payments · ${formatNaira(sum._sum.amountKobo ?? 0)} verified revenue`} />
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
        <Link href="/admin/payments" className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", !status ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/payments?status=${s}`} className={cn("shrink-0 rounded-full border px-3 py-1 text-sm capitalize", status === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white")}>
            {s.toLowerCase()}
          </Link>
        ))}
      </nav>
      {payments.length === 0 ? (
        <EmptyState title="No payments" />
      ) : (
        <TableWrap>
          <thead>
            <tr><th>Reference</th><th>Order</th><th>Customer</th><th>Amount</th><th>Currency</th><th>Status</th><th>Paystack ID</th><th>Created</th><th>Paid</th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.reference}</td>
                <td><Link href={`/admin/orders/${p.order.id}`} className="text-brand-700 hover:underline">{p.order.orderNumber}</Link></td>
                <td className="text-xs">{p.user.email}</td>
                <td className="tabular-nums">{formatNaira(p.amountKobo)}</td>
                <td>{p.currency}</td>
                <td><Badge tone={p.status === "SUCCESS" ? "success" : p.status === "PENDING" ? "warning" : "neutral"}>{p.status}</Badge></td>
                <td className="font-mono text-xs">{p.paystackId ?? "—"}</td>
                <td className="whitespace-nowrap text-xs">{formatDateTime(p.createdAt)}</td>
                <td className="whitespace-nowrap text-xs">{formatDateTime(p.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} basePath="/admin/payments" params={{ status }} />
    </>
  );
}
