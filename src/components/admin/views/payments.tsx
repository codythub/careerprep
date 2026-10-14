"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, RefreshCw, Undo2 } from "lucide-react";
import { adminApi, type AdminPayment } from "@/lib/laravel/admin";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, PageHeader, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { useApi } from "@/components/candidate/auth";
import { ListSkeleton } from "@/components/candidate/views/loading";
import { useAdminRunner } from "@/components/admin/admin-shell";
import { ConfirmAction, DataList, EntitlementBadge, FilterBar, PaymentStatusBadge, UserCell, money, useListQuery } from "@/components/admin/ui";

const STATUS_OPTIONS = [
  { value: "verified", label: "Verified" },
  { value: "initialized", label: "Checkout started" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function AdminPaymentsView() {
  const { filters, page, key } = useListQuery(["status", "reference", "user_id", "from", "to"]);
  const payments = useApi((t) => adminApi.payments(t, { ...filters, page }), [key]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Payments" description={payments.data ? `${payments.data.total} payments` : "Paystack payments verified by CareerPrep."} />
      <FilterBar
        fields={[
          { name: "reference", label: "Reference", type: "text", placeholder: "CP-…" },
          { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
          { name: "from", label: "Created from", type: "date" },
          { name: "to", label: "Created to", type: "date" },
        ]}
      />
      {filters.user_id && (
        <p className="mb-4 text-sm text-slate-600">
          Showing payments for user {filters.user_id}.{" "}
          <Link href="/admin/payments" className="font-medium text-brand-700 underline underline-offset-2">
            Show all
          </Link>
        </p>
      )}
      {payments.loading ? (
        <ListSkeleton label="Loading payments…" />
      ) : payments.error ? (
        <Alert tone="error" title="We couldn't load payments" action={<Button variant="outline" size="sm" onClick={payments.reload}>Try again</Button>}>
          {payments.error}
        </Alert>
      ) : (
        <>
          <DataList
            rows={payments.data!.items}
            href={(p) => `/admin/payments/${p.id}`}
            empty={{ title: "No payments found", body: "Try different filters.", icon: <CreditCard /> }}
            columns={[
              { header: "Reference", cell: (p) => <span className="font-mono text-xs">{p.reference ?? p.id}</span> },
              { header: "Candidate", cell: (p) => <UserCell user={p.user} id={p.userId} />, className: "max-w-56" },
              { header: "Amount", cell: (p) => money(p.amount, p.currency), className: "whitespace-nowrap tabular-nums" },
              { header: "Status", cell: (p) => <PaymentStatusBadge status={p.status} /> },
              { header: "Review", cell: (p) => <EntitlementBadge status={p.entitlementStatus} /> },
              { header: "Created", cell: (p) => formatDateTime(p.createdAt), className: "whitespace-nowrap text-slate-600" },
            ]}
            card={(p) => (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-slate-700">{p.reference ?? p.id}</span>
                  <span className="text-sm font-semibold tabular-nums">{money(p.amount, p.currency)}</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-slate-900">{p.user?.name ?? p.user?.email ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PaymentStatusBadge status={p.status} />
                  <EntitlementBadge status={p.entitlementStatus} />
                  <span className="text-xs text-slate-500">{formatDateTime(p.createdAt)}</span>
                </div>
              </>
            )}
          />
          <Pagination page={payments.data!.currentPage} pageCount={payments.data!.lastPage} basePath="/admin/payments" params={filters} />
        </>
      )}
    </>
  );
}

const Back = () => (
  <Link href="/admin/payments" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> Payments
  </Link>
);

export function AdminPaymentDetailView({ id }: { id: string }) {
  const loaded = useApi((t) => adminApi.payment(t, id), [id]);
  const run = useAdminRunner();
  const [updated, setUpdated] = useState<AdminPayment | null>(null);
  const [reverifyResult, setReverifyResult] = useState<{ verified: boolean; providerStatus: string | null } | null>(null);
  const [note, setNote] = useState("");
  const noteId = useId();
  const p = updated ?? loaded.data;

  if (loaded.loading && !p) return (<><Back /><Skeleton className="mt-6 h-64" /></>);
  if (!p) {
    return (
      <>
        <Back />
        <Alert tone="error" title={loaded.status === 404 ? "Payment not found" : "We couldn't load this payment"} className="mt-6">
          {loaded.status === 404 ? "This payment doesn't exist." : loaded.error}
        </Alert>
      </>
    );
  }

  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader
          eyebrow="Payment"
          title={money(p.amount, p.currency)}
          description={
            <span className="flex flex-wrap items-center gap-2">
              <PaymentStatusBadge status={p.status} />
              <EntitlementBadge status={p.entitlementStatus} />
              <span className="font-mono text-xs wrap-anywhere">{p.reference}</span>
            </span>
          }
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardBody>
            <DefinitionList
              items={[
                ["Candidate", <UserCell key="u" user={p.user} id={p.userId} />],
                ["Reference", <span key="r" className="font-mono text-xs wrap-anywhere">{p.reference ?? "—"}</span>],
                ["Paystack transaction", p.providerTransactionId ?? "—"],
                ["Created", formatDateTime(p.createdAt)],
                ["Verified", formatDateTime(p.verifiedAt)],
                ["Resume", p.resumeId ? <Link key="res" href={`/admin/resumes/${p.resumeId}`} className="text-brand-700 hover:underline">Resume {p.resumeId}</Link> : "—"],
                ["Review", p.reviewId ? <Link key="rev" href={`/admin/reviews/${p.reviewId}`} className="text-brand-700 hover:underline">Review {p.reviewId}</Link> : "Not started"],
                ...(p.status === "refunded" ? ([["Refunded", formatDateTime(p.refundedAt)], ["Refund note", p.refundNote ?? "—"]] as Array<[string, string]>) : []),
              ]}
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="font-semibold">Actions</h2>
              {reverifyResult && (
                <Alert tone={reverifyResult.verified ? "success" : "warning"} title={reverifyResult.verified ? "Paystack confirms this payment" : "Paystack did not confirm this payment"}>
                  Paystack status: <strong>{reverifyResult.providerStatus ?? "unknown"}</strong>
                </Alert>
              )}
              <ConfirmAction
                label="Re-verify with Paystack"
                icon={<RefreshCw className="size-4" aria-hidden />}
                title="Re-verify this payment?"
                description="CareerPrep asks Paystack for this transaction again. If Paystack confirms the amount and currency, the payment becomes verified. It never moves money."
                confirmLabel="Re-verify"
                disabled={p.status === "refunded"}
                disabledReason="Refunded payments can't be re-verified."
                onConfirm={async () => {
                  const res = await run((t) => adminApi.reverifyPayment(t, p.id), "payment");
                  setUpdated(res.payment);
                  setReverifyResult({ verified: res.verified, providerStatus: res.providerStatus });
                }}
              />
              <ConfirmAction
                label="Mark as refunded"
                icon={<Undo2 className="size-4" aria-hidden />}
                tone="danger"
                title="Record a refund"
                description={
                  <>
                    Only do this <strong>after</strong> refunding in the Paystack dashboard — this records it here and moves no money. An unused review
                    becomes unavailable, and the candidate can no longer retry a used one. This can&apos;t be undone.
                  </>
                }
                confirmLabel="Mark as refunded"
                canConfirm={note.trim().length > 0}
                disabled={p.status !== "verified"}
                disabledReason={p.status === "refunded" ? "Already marked as refunded." : "Only verified payments can be marked as refunded."}
                onConfirm={async () => {
                  const res = await run((t) => adminApi.markRefunded(t, p.id, note.trim()), "note");
                  setUpdated(res);
                  setNote("");
                }}
              >
                <label htmlFor={noteId} className="block text-sm font-medium text-slate-800">
                  Refund note <span className="text-red-600" aria-hidden>*</span>
                </label>
                <textarea
                  id={noteId}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  required
                  placeholder="e.g. Refunded in Paystack on 14 Oct — review failed twice"
                  className="mt-1.5 block w-full rounded-lg border border-line-strong px-3 py-2 text-base shadow-xs focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus:outline-none sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">{note.length}/1000 · saved in the audit log</p>
              </ConfirmAction>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
