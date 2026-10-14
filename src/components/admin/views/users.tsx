"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { adminApi } from "@/lib/laravel/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, PageHeader, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { BreakableText } from "@/components/ui/breakable";
import { useApi } from "@/components/candidate/auth";
import { ReviewStatusBadge, ScorePill } from "@/components/candidate/review-view";
import { ExtractionBadge } from "@/components/candidate/views/resumes";
import { ListSkeleton } from "@/components/candidate/views/loading";
import { DataList, FilterBar, PaymentStatusBadge, RoleBadge, money, useListQuery } from "@/components/admin/ui";

export function AdminUsersView() {
  const { filters, page, key } = useListQuery(["search", "role"]);
  const users = useApi((t) => adminApi.users(t, { ...filters, page }), [key]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" description={users.data ? `${users.data.total} accounts` : "Search candidates and staff."} />
      <FilterBar
        fields={[
          { name: "search", label: "Search", type: "search", placeholder: "Name or email" },
          { name: "role", label: "Role", type: "select", options: [{ value: "candidate", label: "Candidates" }, { value: "admin", label: "Admins" }] },
        ]}
      />
      {users.loading ? (
        <ListSkeleton label="Loading users…" />
      ) : users.error ? (
        <Alert tone="error" title="We couldn't load users" action={<Button variant="outline" size="sm" onClick={users.reload}>Try again</Button>}>
          {users.error}
        </Alert>
      ) : (
        <>
          <DataList
            rows={users.data!.items}
            href={(u) => `/admin/users/${u.id}`}
            empty={{ title: "No users found", body: "Try a different name or email.", icon: <Users /> }}
            columns={[
              { header: "User", cell: (u) => (<><p className="font-medium text-slate-900">{u.name ?? "—"}</p><p className="text-xs text-slate-500">{u.email}</p></>) },
              { header: "Role", cell: (u) => <RoleBadge role={u.role} /> },
              { header: "Resumes", cell: (u) => u.resumesCount ?? "—", className: "tabular-nums" },
              { header: "Payments", cell: (u) => u.paymentsCount ?? "—", className: "tabular-nums" },
              { header: "Reviews", cell: (u) => u.reviewsCount ?? "—", className: "tabular-nums" },
              { header: "Joined", cell: (u) => formatDate(u.createdAt), className: "whitespace-nowrap text-slate-600" },
            ]}
            card={(u) => (
              <>
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-slate-900">{u.name ?? "—"}</p>
                  {u.role === "admin" && <RoleBadge role={u.role} />}
                </div>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {u.resumesCount ?? 0} resumes · {u.paymentsCount ?? 0} payments · {u.reviewsCount ?? 0} reviews
                </p>
              </>
            )}
          />
          <Pagination page={users.data!.currentPage} pageCount={users.data!.lastPage} basePath="/admin/users" params={filters} />
        </>
      )}
    </>
  );
}

const Back = () => (
  <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> Users
  </Link>
);

export function AdminUserDetailView({ id }: { id: string }) {
  const user = useApi((t) => adminApi.user(t, id), [id]);
  if (user.loading) return (<><Back /><Skeleton className="mt-6 h-64" /></>);
  if (!user.data) {
    return (
      <>
        <Back />
        <Alert tone="error" title={user.status === 404 ? "User not found" : "We couldn't load this user"} className="mt-6">
          {user.status === 404 ? "This account doesn't exist." : user.error}
        </Alert>
      </>
    );
  }
  const u = user.data;
  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader eyebrow="User" title={u.name ?? u.email ?? `User ${u.id}`} description={<span className="flex flex-wrap items-center gap-2"><RoleBadge role={u.role} /><span className="wrap-anywhere">{u.email}</span></span>} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardBody>
            <DefinitionList
              items={[
                ["Phone", u.phone ?? "—"],
                ["Location", u.location ?? "—"],
                ["Professional title", u.professionalTitle ?? "—"],
                ["Joined", formatDate(u.createdAt)],
                ["Resumes", u.resumesCount ?? 0],
                ["Payments", u.paymentsCount ?? 0],
                ["Reviews", u.reviewsCount ?? 0],
                ["User ID", u.id],
              ]}
            />
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Section title="Latest payments" href={`/admin/payments?user_id=${u.id}`} empty="No payments yet.">
            {u.latestPayments.map((p) => (
              <Row key={p.id} href={`/admin/payments/${p.id}`} primary={<span className="font-mono text-xs">{p.reference ?? `Payment ${p.id}`}</span>} secondary={formatDateTime(p.createdAt)}>
                <span className="text-sm font-medium tabular-nums">{money(p.amount, p.currency)}</span>
                <PaymentStatusBadge status={p.status} />
              </Row>
            ))}
          </Section>
          <Section title="Latest reviews" href={`/admin/reviews?user_id=${u.id}`} empty="No reviews yet.">
            {u.latestReviews.map((r) => (
              <Row key={r.id} href={`/admin/reviews/${r.id}`} primary={r.resumeName ? <BreakableText text={r.resumeName} /> : `Review ${r.id}`} secondary={formatDateTime(r.createdAt)}>
                {r.status === "completed" && <ScorePill score={r.overallScore} max={r.overallMax} />}
                <ReviewStatusBadge status={r.status} />
              </Row>
            ))}
          </Section>
          <Section title="Latest resumes" href={`/admin/resumes?user_id=${u.id}`} empty="No resumes yet.">
            {u.latestResumes.map((r) => (
              <Row key={r.id} href={`/admin/resumes/${r.id}`} primary={<BreakableText text={r.fileName} />} secondary={formatDateTime(r.createdAt)}>
                <ExtractionBadge status={r.extractionStatus} />
              </Row>
            ))}
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, href, empty, children }: { title: string; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          <Link href={href} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all
          </Link>
        </div>
        {children.length ? <ul className="mt-3 divide-y divide-line">{children}</ul> : <p className="mt-3 text-sm text-slate-500">{empty}</p>}
      </CardBody>
    </Card>
  );
}

function Row({ href, primary, secondary, children }: { href: string; primary: React.ReactNode; secondary: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex flex-col gap-2 py-3 hover:text-brand-700 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block text-sm font-medium wrap-anywhere text-slate-900">{primary}</span>
          <span className="block text-xs text-slate-500">{secondary}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">{children}</span>
      </Link>
    </li>
  );
}
