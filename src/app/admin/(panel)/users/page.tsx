import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, PageHeader, TableWrap } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { OpButton } from "@/components/admin/admin-forms";
import { setUserRoleAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Users" };
const PAGE = 30;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where = q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {};
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true, applications: true } } },
    }),
  ]);
  return (
    <>
      <PageHeader title="Users" description={`${total} user${total === 1 ? "" : "s"}`} />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="uq" className="sr-only">Search users</label>
        <input id="uq" name="q" defaultValue={q} placeholder="Search name or email" className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm" />
        <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">Search</button>
      </form>
      <TableWrap>
        <thead>
          <tr><th>User</th><th>Role</th><th>Orders</th><th>Applications</th><th>Joined</th><th></th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><span className="block font-medium">{u.name ?? "—"}</span><span className="text-xs text-slate-500">{u.email}</span></td>
              <td><Badge tone={u.role === "ADMIN" ? "brand" : "neutral"}>{u.role}</Badge></td>
              <td className="tabular-nums">{u._count.orders}</td>
              <td className="tabular-nums">{u._count.applications}</td>
              <td className="whitespace-nowrap">{formatDate(u.createdAt)}</td>
              <td className="text-right">
                {u.id !== admin.id && (
                  <OpButton
                    action={setUserRoleAction}
                    fields={{ userId: u.id, role: u.role === "ADMIN" ? "USER" : "ADMIN" }}
                    variant="ghost"
                    confirm={u.role === "ADMIN" ? "Remove admin access?" : "Grant full admin access to this user?"}
                  >
                    {u.role === "ADMIN" ? "Make user" : "Make admin"}
                  </OpButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PAGE))} basePath="/admin/users" params={{ q: q || undefined }} />
    </>
  );
}
