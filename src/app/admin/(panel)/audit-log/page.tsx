import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Audit Log" };
const PAGE = 50;

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit-log">) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { email: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Audit Log" description="Every important administrative action is recorded here." />
      {logs.length === 0 ? (
        <EmptyState title="No admin actions recorded yet" />
      ) : (
        <TableWrap>
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(l.createdAt)}</td>
                <td className="text-xs">{l.actor?.email ?? "system"}</td>
                <td className="font-mono text-xs">{l.action}</td>
                <td className="text-xs">{l.entityType} <span className="font-mono text-slate-500">{l.entityId.slice(0, 10)}</span></td>
                <td className="max-w-64 truncate font-mono text-xs text-slate-600">{l.meta ? JSON.stringify(l.meta) : ""}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} basePath="/admin/audit-log" params={{}} />
    </>
  );
}
