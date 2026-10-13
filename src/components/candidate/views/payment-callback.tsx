"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { getPendingPayment } from "@/lib/laravel/token";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { ProgressBar } from "@/components/ui/progress";
import { StartReviewButton } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";

/** What identifies the payment to verify: Paystack's `?reference=`, else the ID saved before checkout. */
type Lookup = { reference: string } | { paymentId: number };

/**
 * Paystack returns the candidate here with `?reference=&trxref=`. Those values only locate the
 * candidate's own payment (GET /payments?reference=, scoped to them by Laravel); the payment is
 * then verified server-side with POST /payments/{payment}/verify before the review unlocks.
 */
export function PaymentCallbackView() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  // undefined = not read yet (client storage), null = nothing to verify.
  const [lookup, setLookup] = useState<Lookup | null | undefined>(reference ? { reference } : undefined);
  useEffect(() => {
    if (reference) return;
    const t = setTimeout(() => {
      const pending = getPendingPayment();
      setLookup(pending ? { paymentId: pending.paymentId } : null);
    }, 0);
    return () => clearTimeout(t);
  }, [reference]);

  if (lookup === undefined) return <Verifying />;
  if (!lookup) return <NoPayment />;
  return <Verify lookup={lookup} />;
}

function NoPayment() {
  return (
    <Shell icon={<XCircle className="size-6 text-rose-600" />} title="No payment to confirm" tone="danger">
      <p>We couldn&apos;t identify the payment to verify. If you were charged, contact support with your Paystack receipt.</p>
      <LinkButton href="/dashboard/resumes" className="mt-6">Back to my resumes</LinkButton>
    </Shell>
  );
}

async function findAndVerify(token: string, lookup: Lookup) {
  const paymentId = "paymentId" in lookup ? lookup.paymentId : (await api.findPaymentByReference(token, lookup.reference))?.id;
  if (paymentId === undefined) return null;
  try {
    return { payment: await api.verifyPayment(token, paymentId), notPaid: null };
  } catch (err) {
    if (!(err instanceof ApiError) || err.isUnauthorized) throw err;
    // Verify re-asks Paystack even for a payment Laravel already verified, so a Paystack hiccup
    // must not hide an earlier verification: fall back to Laravel's stored status.
    const stored = await api.getPayment(token, paymentId);
    if (stored.status === "verified") return { payment: stored, notPaid: null };
    // 422: Paystack did not report a successful payment for the expected amount/currency.
    if (err.status === 422) return { payment: stored, notPaid: err.fieldErrors.payment?.[0] ?? err.message };
    throw err;
  }
}

function Verify({ lookup }: { lookup: Lookup }) {
  const key = "reference" in lookup ? lookup.reference : lookup.paymentId;
  const result = useApi((t) => findAndVerify(t, lookup), [key]);

  if (result.loading) return <Verifying />;

  if (result.error) {
    return (
      <Shell icon={<Clock className="size-6 text-amber-600" />} title="We couldn't confirm your payment yet" tone="warning">
        <Alert tone="warning" className="text-left">{result.error}</Alert>
        <p className="mt-4">If you completed payment, wait a moment and check again — confirmation can take a few seconds.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={result.reload}>Check again</Button>
          <LinkButton href="/dashboard/resumes" variant="outline">My resumes</LinkButton>
        </div>
      </Shell>
    );
  }

  if (!result.data) return <NoPayment />;
  const { payment, notPaid } = result.data;
  const resumeHref = payment.resumeId ? `/dashboard/resumes/${payment.resumeId}` : "/dashboard/resumes";

  if (notPaid !== null || payment.status !== "verified") {
    return (
      <Shell icon={<XCircle className="size-6 text-rose-600" />} title="Payment not completed" tone="danger">
        <p>CareerPrep could not confirm this payment. You have not been given a review for this attempt.</p>
        {notPaid && <p className="mt-2 text-sm">{notPaid}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href={resumeHref}>Try again</LinkButton>
          <Button variant="outline" onClick={result.reload}>Check again</Button>
        </div>
      </Shell>
    );
  }

  if (payment.entitlementStatus === "consumed") {
    return (
      <Shell icon={<CheckCircle2 className="size-6 text-emerald-600" />} title="Payment already used" tone="success">
        <p>This payment was verified and its review has already been started.</p>
        <div className="mt-6 flex justify-center">
          <LinkButton href={payment.reviewId ? `/dashboard/reviews/${payment.reviewId}` : "/dashboard/reviews"}>Open the review</LinkButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell icon={<CheckCircle2 className="size-6 text-emerald-600" />} title="Payment confirmed" tone="success">
      <p>CareerPrep verified your payment with Paystack. Your resume review is unlocked.</p>
      {payment.reference && <p className="mt-1 text-xs text-slate-500">Reference: {payment.reference}</p>}
      <div className="mt-6">
        <StartReviewButton paymentId={payment.id} embedded />
      </div>
    </Shell>
  );
}

/** Shown while Laravel checks the payment with Paystack (the browser never decides it). */
function Verifying() {
  return (
    <Shell icon={<ShieldCheck className="size-6 text-brand-600" />} title="Verifying your payment">
      <p aria-live="polite">CareerPrep is confirming your payment with Paystack. This usually takes a few seconds.</p>
      <ProgressBar label="Verifying payment" className="mx-auto mt-6 max-w-xs" />
    </Shell>
  );
}

const SHELL_TONES = {
  neutral: "bg-brand-50 ring-brand-100",
  success: "bg-emerald-50 ring-emerald-200",
  warning: "bg-amber-50 ring-amber-200",
  danger: "bg-rose-50 ring-rose-200",
};

function Shell({
  icon,
  title,
  tone = "neutral",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: keyof typeof SHELL_TONES;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/dashboard/resumes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> My resumes
      </Link>
      <div className="card mt-4 p-6 text-center text-slate-600 sm:p-8">
        <span className={`mx-auto flex size-12 items-center justify-center rounded-xl ring-1 ${SHELL_TONES[tone]}`}>{icon}</span>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed sm:text-base">{children}</div>
      </div>
    </div>
  );
}
