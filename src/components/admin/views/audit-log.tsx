"use client";

import Link from "next/link";
import { ScrollText } from "lucide-react";
import { AUDIT_ACTIONS, adminApi, type AuditEntry } from "@/lib/laravel/admin";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Alert, Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { useApi } from "@/components/candidate/auth";
import { ListSkeleton } from "@/components/candidate/views/loading";
import { FilterBar, useListQuery } from "@/components/admin/ui";

const ACTION_LABEL: Record<string, string> = {
  "resume.download": "Downloaded resume",
  "payment.reverify": "Re-verified payment",
  "payment.mark_refunded": "Marked payment refunded",
  "review.retry": "Retried review",
  "review.grant_attempt": "Granted extra attempt",
};

const TARGET_PATH: Record<string, string> = { payment: "/admin/payments", review: "/admin/reviews", resume: "/admin/resumes", user: "/admin/users" };

function summary(o: Record<string, unknown> | null) {
  if (!o || !Object.keys(o).length) return null;
  return Object.entries(o)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v === null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

function Entry({ e }: { e: AuditEntry }) {
  const target = e.targetType && e.targetId ? `${e.targetType} ${e.targetId}` : null;
  const targetHref = e.targetType && e.targetId && TARGET_PATH[e.targetType] ? `${TARGET_PATH[e.targetType]}/${e.targetId}` : null;
  const before = summary(e.before);
  const after = summary(e.after);
  return (
    <li className="p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="brand">{ACTION_LABEL[e.action] ?? e.action}</Badge>
            {target &&
              (targetHref ? (
                <Link href={targetHref} className="font-medium text-brand-700 hover:underline">
                  {target}
                </Link>
              ) : (
                <span className="font-medium">{target}</span>
              ))}
          </p>
          <p className="mt-1.5 text-sm text-slate-700">
            by{" "}
            {e.actor ? (
              <Link href={`/admin/users/${e.actor.id}`} className="font-medium hover:text-brand-700">
                {e.actor.name ?? e.actor.email}
              </Link>
            ) : (
              <span className="text-slate-500">a deleted admin</span>
            )}
            {e.ipAddress && <span className="text-slate-500"> · {e.ipAddress}</span>}
          </p>
        </div>
        <time className="shrink-0 text-xs text-slate-500" dateTime={e.createdAt ?? undefined}>
          {formatDateTime(e.createdAt)}
        </time>
      </div>
      {(before || after) && (
        <dl className="mt-3 grid gap-2 rounded-xl bg-surface p-3 text-xs sm:grid-cols-2">
          {before && (
            <div className="min-w-0">
              <dt className="font-semibold text-slate-500">Before</dt>
              <dd className="mt-0.5 wrap-anywhere text-slate-700">{before}</dd>
            </div>
          )}
          {after && (
            <div className="min-w-0">
              <dt className="font-semibold text-slate-500">After</dt>
              <dd className="mt-0.5 wrap-anywhere text-slate-700">{after}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

export function AdminAuditLogView() {
  const { filters, page, key } = useListQuery(["action", "actor_id"]);
  const log = useApi((t) => adminApi.auditLog(t, { ...filters, page }), [key]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Audit log" description="Every admin action and resume download, newest first." />
      <FilterBar fields={[{ name: "action", label: "Action", type: "select", options: AUDIT_ACTIONS.map((a) => ({ value: a, label: ACTION_LABEL[a] ?? a })) }]} />
      {log.loading ? (
        <ListSkeleton label="Loading the audit log…" />
      ) : log.error ? (
        <Alert tone="error" title="We couldn't load the audit log" action={<Button variant="outline" size="sm" onClick={log.reload}>Try again</Button>}>
          {log.error}
        </Alert>
      ) : log.data!.items.length === 0 ? (
        <EmptyState icon={<ScrollText />} title="No admin actions yet">
          Re-verifications, refunds, retries, granted attempts and resume downloads will appear here.
        </EmptyState>
      ) : (
        <>
          <ul className="card divide-y divide-line">
            {log.data!.items.map((e) => (
              <Entry key={e.id} e={e} />
            ))}
          </ul>
          <Pagination page={log.data!.currentPage} pageCount={log.data!.lastPage} basePath="/admin/audit-log" params={filters} />
        </>
      )}
    </>
  );
}
