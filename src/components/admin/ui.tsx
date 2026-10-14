"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { EntitlementStatus, PaymentStatus } from "@/lib/laravel/types";
import type { Role, UserSummary } from "@/lib/laravel/admin";
import { formatPrice } from "@/lib/laravel/use-pricing";
import { Button, buttonClass } from "@/components/ui/button";
import { Alert, Badge, EmptyState, TableWrap } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const PAYMENT: Record<PaymentStatus, [string, Tone]> = {
  pending: ["Pending", "neutral"],
  initialized: ["Checkout started", "info"],
  verified: ["Verified", "success"],
  failed: ["Failed", "danger"],
  refunded: ["Refunded", "warning"],
  unknown: ["Unknown", "neutral"],
};
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const [label, tone] = PAYMENT[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const ENTITLEMENT: Record<EntitlementStatus, [string, Tone]> = {
  available: ["Review unused", "brand"],
  consumed: ["Review used", "neutral"],
  unavailable: ["No review", "neutral"],
  unknown: ["Unknown", "neutral"],
};
export function EntitlementBadge({ status }: { status: EntitlementStatus }) {
  const [label, tone] = ENTITLEMENT[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  return role === "admin" ? <Badge tone="accent">Admin</Badge> : <Badge>Candidate</Badge>;
}

export function money(amount: number | null, currency: string | null) {
  return amount === null ? "—" : formatPrice(amount, currency);
}

/** Name + email linking to the admin user page. */
export function UserCell({ user, id }: { user: UserSummary | null; id?: string | null }) {
  const userId = user?.id ?? id;
  if (!userId) return <span className="text-slate-400">—</span>;
  return (
    <Link href={`/admin/users/${userId}`} className="group block min-w-0">
      <span className="block truncate font-medium text-slate-900 group-hover:text-brand-700">{user?.name ?? `User ${userId}`}</span>
      {user?.email && <span className="block truncate text-xs text-slate-500">{user.email}</span>}
    </Link>
  );
}

export type FilterField =
  | { name: string; label: string; type: "search" | "text"; placeholder?: string }
  | { name: string; label: string; type: "date" }
  | { name: string; label: string; type: "select"; options: Array<{ value: string; label: string }> };

/**
 * Filters kept in the URL (?name=value), so lists are shareable and the back button works.
 * Submitting resets to page 1.
 */
export function FilterBar({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeCount = fields.filter((f) => params.get(f.name)).length;
  const active = activeCount > 0;
  // Phones: filters collapse behind a toggle so the list stays near the top. Larger screens: always shown.
  const [showOnMobile, setShowOnMobile] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget).entries()) if (String(v).trim()) q.set(k, String(v).trim());
    const s = q.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  }

  const control =
    "block w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base shadow-xs focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus:outline-none sm:text-sm";
  return (
    <>
      <Button
        variant="outline"
        className="mb-4 w-full sm:hidden"
        aria-expanded={showOnMobile}
        aria-controls="list-filters"
        onClick={() => setShowOnMobile((v) => !v)}
      >
        <SlidersHorizontal className="size-4" aria-hidden /> {showOnMobile ? "Hide filters" : "Filters"}
        {active && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeCount}</span>}
      </Button>
      <form
        id="list-filters"
        onSubmit={submit}
        className={cn("card mb-5 gap-3 p-4 sm:grid sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end", showOnMobile ? "grid" : "hidden")}
        role="search"
      >
        {fields.map((f) => (
          <div key={f.name} className={cn("min-w-0 space-y-1", f.type === "search" && "sm:col-span-2 lg:min-w-64 lg:flex-1")}>
            <label htmlFor={`f-${f.name}`} className="block text-xs font-medium text-slate-600">
              {f.label}
            </label>
            {f.type === "select" ? (
              <select id={`f-${f.name}`} name={f.name} defaultValue={params.get(f.name) ?? ""} className={control}>
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`f-${f.name}`}
                name={f.name}
                type={f.type === "search" ? "search" : f.type}
                defaultValue={params.get(f.name) ?? ""}
                placeholder={"placeholder" in f ? f.placeholder : undefined}
                className={control}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" size="md" className="flex-1 lg:flex-none">
            <Search className="size-4" aria-hidden /> Apply
          </Button>
          {active && (
            <Link href={pathname} className={buttonClass("ghost", "md")}>
              <X className="size-4" aria-hidden /> Clear
            </Link>
          )}
        </div>
      </form>
    </>
  );
}

export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

/** Table on desktop, tappable cards on mobile. */
export function DataList<T extends { id: string }>({
  rows,
  columns,
  href,
  card,
  empty,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  href: (row: T) => string;
  /** Mobile card content (the whole card links to `href`). */
  card: (row: T) => ReactNode;
  empty: { title: string; body?: ReactNode; icon?: ReactNode };
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title={empty.title} icon={empty.icon}>
        {empty.body}
      </EmptyState>
    );
  }
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={href(row)} className="card card-hover flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">{card(row)}</div>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <TableWrap>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={c.className}>
                  {c.header}
                </th>
              ))}
              <th>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.header} className={c.className}>
                    {c.cell(row)}
                  </td>
                ))}
                <td className="text-right">
                  <Link href={href(row)} className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-brand-700 hover:text-brand-800">
                    Open <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}

/**
 * Inline confirmation for an admin write: the trigger opens a panel describing the effect;
 * Confirm runs once (double submits are blocked) and errors stay in the panel.
 */
export function ConfirmAction({
  label,
  icon,
  title,
  description,
  confirmLabel,
  tone = "primary",
  canConfirm = true,
  onConfirm,
  children,
  disabled,
  disabledReason,
}: {
  label: string;
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  canConfirm?: boolean;
  /** Throw to show an error; resolve to close the panel. */
  onConfirm: () => Promise<void>;
  children?: ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="outline" onClick={() => setOpen(true)} disabled={disabled} className="w-full sm:w-auto">
          {icon}
          {label}
        </Button>
        {disabled && disabledReason && <p className="mt-1.5 text-xs text-slate-500">{disabledReason}</p>}
      </div>
    );
  }
  return (
    <div className="animate-fade-up rounded-xl border border-line-strong bg-white p-4 shadow-sm" role="group" aria-label={title}>
      <p className="font-semibold text-slate-950">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-slate-600">{description}</div>
      {children && <div className="mt-4">{children}</div>}
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => void confirm()} loading={busy} disabled={!canConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/** Current filter values (and page) from the URL; `key` changes whenever any of them does. */
export function useListQuery(names: string[]) {
  const params = useSearchParams();
  const filters: Record<string, string | undefined> = {};
  for (const n of names) filters[n] = params.get(n) ?? undefined;
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  return { filters, page, key: `${names.map((n) => filters[n] ?? "").join("|")}|${page}` };
}
