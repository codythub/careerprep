import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";
import { Card, CardBody, PageHeader, StatCard } from "@/components/ui/primitives";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { requireAdmin } from "@/server/session";
import { PAID_STATUSES } from "@/server/services/order-status";

export default async function AdminOverview() {
  await requireAdmin();
  const [users, orders, paidOrders, completedOrders, revenue, publishedJobs, pendingSubs, applications, jobViews, applyClicks, recentOrders] =
    await Promise.all([
      db.user.count(),
      db.resumeOrder.count(),
      db.resumeOrder.count({ where: { status: { in: PAID_STATUSES } } }),
      db.resumeOrder.count({ where: { status: { in: ["COMPLETED", "DELIVERED"] } } }),
      db.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true } }),
      db.job.count({ where: { status: "PUBLISHED" } }),
      db.employerSubmission.count({ where: { status: "PENDING" } }),
      db.application.count(),
      db.analyticsEvent.count({ where: { name: "job_view" } }),
      db.jobApplyClick.count(),
      db.resumeOrder.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { email: true } } } }),
    ]);

  return (
    <>
      <PageHeader title="Overview" description="Live figures from the platform database." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard accentIndex={0} label="Total users" value={users.toLocaleString()} />
        <StatCard accentIndex={1} label="Resume orders" value={orders.toLocaleString()} />
        <StatCard accentIndex={2} label="Paid orders" value={paidOrders.toLocaleString()} />
        <StatCard accentIndex={3} label="Completed orders" value={completedOrders.toLocaleString()} />
        <StatCard accentIndex={4} label="Revenue (verified)" value={formatNaira(revenue._sum.amountKobo ?? 0)} hint="Successful Paystack payments" />
        <StatCard accentIndex={5} label="Published jobs" value={publishedJobs.toLocaleString()} />
        <StatCard accentIndex={6} label="Pending job submissions" value={pendingSubs.toLocaleString()} />
        <StatCard accentIndex={7} label="Tracked applications" value={applications.toLocaleString()} />
        <StatCard accentIndex={8} label="Job views" value={jobViews.toLocaleString()} />
        <StatCard accentIndex={9} label="Apply clicks" value={applyClicks.toLocaleString()} />
      </div>
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-700">All orders</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-col gap-1 py-3 hover:text-brand-700 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0 text-sm">
                      <span className="font-medium">{o.orderNumber}</span> · <span className="text-slate-600">{o.user.email}</span>
                      <span className="block text-xs text-slate-500">{o.targetRole} · {formatDate(o.createdAt)}</span>
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
