"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/laravel/api";
import { getPendingPayment, type PendingPayment } from "@/lib/laravel/token";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody } from "@/components/ui/primitives";
import { StartReviewButton } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";
import { Loading } from "@/components/candidate/views/loading";

/**
 * Paystack returns the candidate here. The query string is never trusted: the Laravel payment ID
 * saved before checkout is verified with POST /payments/{payment}/verify before the review unlocks.
 */
export function PaymentCallbackView() {
  // undefined = not read yet (client storage), null = nothing pending.
  const [pending, setPending] = useState<PendingPayment | null | undefined>(undefined);
  useEffect(() => {
    const t = setTimeout(() => setPending(getPendingPayment()), 0);
    return () => clearTimeout(t);
  }, []);

  if (pending === undefined) return <Loading label="Checking your payment…" />;
  if (!pending) {
    return (
      <Shell icon={<XCircle className="size-10 text-rose-500" />} title="No payment to confirm">
        <p>We couldn&apos;t identify the payment to verify. If you were charged, contact support with your Paystack receipt.</p>
        <LinkButton href="/dashboard/resumes" className="mt-6">Back to my resumes</LinkButton>
      </Shell>
    );
  }
  return <Verify pending={pending} />;
}

function Verify({ pending }: { pending: PendingPayment }) {
  const result = useApi((t) => api.verifyPayment(t, pending.paymentId), [pending.paymentId]);
  const resumeHref = `/dashboard/resumes/${pending.resumeId}`;

  if (result.loading) return <Loading label="Confirming your payment with CareerPrep…" />;

  if (result.error) {
    return (
      <Shell icon={<Clock className="size-10 text-amber-500" />} title="We couldn't confirm your payment yet">
        <Alert tone="warning" className="text-left">{result.error}</Alert>
        <p className="mt-4">If you completed payment, wait a moment and check again — confirmation can take a few seconds.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={result.reload}>Check again</Button>
          <LinkButton href="/dashboard/resumes" variant="outline">My resumes</LinkButton>
        </div>
      </Shell>
    );
  }

  const v = result.data!;
  if (!v.verified) {
    return (
      <Shell icon={<XCircle className="size-10 text-rose-500" />} title="Payment not completed">
        <p>
          CareerPrep could not confirm this payment{v.status ? ` (status: ${v.status})` : ""}. You have not been given a review for
          this attempt.
        </p>
        {v.message && <p className="mt-2 text-sm">{v.message}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href={resumeHref}>Try again</LinkButton>
          <Button variant="outline" onClick={result.reload}>Check again</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell icon={<CheckCircle2 className="size-10 text-emerald-600" />} title="Payment confirmed">
      <p>Your payment was verified by CareerPrep. Your resume review is unlocked.</p>
      {v.reference && <p className="mt-1 text-xs text-slate-500">Reference: {v.reference}</p>}
      <div className="mt-6 flex justify-center">
        <StartReviewButton paymentId={pending.paymentId} />
      </div>
    </Shell>
  );
}

function Shell({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg py-6">
      <Link href="/dashboard/resumes" className="text-sm text-slate-500 hover:text-slate-900">← My resumes</Link>
      <Card className="mt-4">
        <CardBody className="text-center text-slate-600">
          <div className="flex justify-center">{icon}</div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
          <div className="mt-3">{children}</div>
        </CardBody>
      </Card>
    </div>
  );
}
