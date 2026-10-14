"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, ClipboardList, CreditCard, FileText, Users, Wallet } from "lucide-react";
import { adminApi, type AdminStats, type MoneyTotal } from "@/lib/laravel/admin";
import { Alert, Card, CardBody, PageHeader, Skeleton, Stat } from "@/components/ui/primitives";
import { useApi } from "@/components/candidate/auth";
import { FilterBar, money, useListQuery } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const totals = (list: MoneyTotal[]) => (list.length ? list.map((m) => money(m.amount, m.currency)).join(" · ") : money(0, "NGN"));

function Breakdown({ title, rows, href }: { title: string; rows: Array<[string, number, string?]>; href: string }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <dl className="mt-4 divide-y divide-line">
          {rows.map(([label, value, link]) => (
            <div key={label} className="flex items-center justify-between py-2.5 text-sm">
              <dt className="text-slate-600">{link ? <Link href={link} className="hover:text-brand-700 hover:underline">{label}</Link> : label}</dt>
              <dd className="font-semibold tabular-nums text-slate-950">{value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}

function Attention({ stats }: { stats: AdminStats }) {
  const items: Array<{ count: number; label: string; href: string; icon: ReactNode }> = [
    { count: stats.reviews.retryableFailed, label: plural(stats.reviews.retryableFailed, "failed review that can still be retried", "failed reviews that can still be retried"), href: "/admin/reviews?status=failed", icon: <ClipboardList className="size-4" /> },
    { count: stats.reviews.pending, label: plural(stats.reviews.pending, "review still processing", "reviews still processing"), href: "/admin/reviews?status=pending", icon: <ClipboardList className="size-4" /> },
    { count: stats.payments.initialized, label: plural(stats.payments.initialized, "checkout started but not verified", "checkouts started but not verified"), href: "/admin/payments?status=initialized", icon: <CreditCard className="size-4" /> },
    { count: stats.resumes.failed, label: plural(stats.resumes.failed, "resume whose text couldn't be read", "resumes whose text couldn't be read"), href: "/admin/resumes?extraction_status=failed", icon: <FileText className="size-4" /> },
  ].filter((i) => i.count > 0);
  if (!items.length) {
    return (
      <Alert tone="success" title="Nothing needs attention">
        No failed reviews, stuck reviews or unverified checkouts in this period.
      </Alert>
    );
  }
  return (
    <Card>
      <CardBody>
        <h2 className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 text-amber-500" aria-hidden /> Needs attention
        </h2>
        <ul className="mt-3 space-y-2">
          {items.map((i) => (
            <li key={i.label}>
              <Link href={i.href} className="flex items-center gap-3 rounded-xl bg-surface p-3 text-sm transition-colors hover:bg-surface-2">
                <span className="text-slate-400" aria-hidden>
                  {i.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="font-semibold tabular-nums text-slate-950">{i.count}</strong> {i.label}
                </span>
                <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function AdminOverview() {
  const { filters, key } = useListQuery(["from", "to"]);
  const stats = useApi((t) => adminApi.stats(t, { from: filters.from, to: filters.to }), [key]);
  const s = stats.data;
  const period = s?.period.from || s?.period.to ? `${formatDate(s?.period.from)} – ${formatDate(s?.period.to)}` : "All time";

  return (
    <>
      <PageHeader eyebrow="Admin" title="Overview" description={s ? period : "Platform activity at a glance."} />
      <FilterBar
        fields={[
          { name: "from", label: "From", type: "date" },
          { name: "to", label: "To", type: "date" },
        ]}
      />
      {stats.error && (
        <Alert tone="error" title="We couldn't load the stats" className="mb-6">
          {stats.error}
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Verified revenue" icon={<Wallet />} value={s ? totals(s.revenue) : <Skeleton className="h-8 w-24" />} hint={s && s.refunds.length ? `Refunded ${totals(s.refunds)}` : "Net of refunds"} />
        <Stat label="Users" icon={<Users />} value={s ? s.users.total : <Skeleton className="h-8 w-12" />} hint={s ? `${s.users.admin} admin` : undefined} />
        <Stat label="Payments verified" icon={<CreditCard />} value={s ? s.payments.verified : <Skeleton className="h-8 w-12" />} hint={s ? `of ${s.payments.total} started` : undefined} />
        <Stat label="Reviews completed" icon={<ClipboardList />} value={s ? s.reviews.completed : <Skeleton className="h-8 w-12" />} hint={s ? `${s.reviews.failed} failed` : undefined} />
      </div>

      <div className="mt-6">{s ? <Attention stats={s} /> : !stats.error && <Skeleton className="h-28" />}</div>

      {s && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Breakdown
            title="Payments"
            href="/admin/payments"
            rows={[
              ["Verified", s.payments.verified, "/admin/payments?status=verified"],
              ["Checkout started", s.payments.initialized, "/admin/payments?status=initialized"],
              ["Pending", s.payments.pending, "/admin/payments?status=pending"],
              ["Failed", s.payments.failed, "/admin/payments?status=failed"],
              ["Refunded", s.payments.refunded, "/admin/payments?status=refunded"],
            ]}
          />
          <Breakdown
            title="Reviews"
            href="/admin/reviews"
            rows={[
              ["Completed", s.reviews.completed, "/admin/reviews?status=completed"],
              ["Failed", s.reviews.failed, "/admin/reviews?status=failed"],
              ["Retryable failed", s.reviews.retryableFailed],
              ["Processing", s.reviews.pending, "/admin/reviews?status=pending"],
            ]}
          />
          <Breakdown
            title="Resumes"
            href="/admin/resumes"
            rows={[
              ["Readable", s.resumes.succeeded, "/admin/resumes?extraction_status=succeeded"],
              ["Unreadable", s.resumes.failed, "/admin/resumes?extraction_status=failed"],
              ["Pending", s.resumes.pending, "/admin/resumes?extraction_status=pending"],
              ["Total", s.resumes.total],
            ]}
          />
        </div>
      )}
      <p className="mt-6 text-xs text-slate-500">
        Counts use each record&apos;s creation date. Revenue counts verified payments by verification date, net of refunds.
      </p>
    </>
  );
}
