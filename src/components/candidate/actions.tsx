"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { ActionForm, FormMessage, SubmitButton, TextField } from "@/components/ui/form";
import { Button, buttonClass } from "@/components/ui/button";
import { Alert, Skeleton } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/action-state";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { clearPendingPayment, savePendingPayment } from "@/lib/laravel/token";
import type { Candidate, Review } from "@/lib/laravel/types";
import { usePricing } from "@/lib/laravel/use-pricing";
import { REVIEW_PROGRESS } from "@/lib/review-progress";
import { useApi, useCandidateAuth } from "@/components/candidate/auth";
import { ReviewProgress } from "@/components/candidate/review-progress";
import { useStagedProgress } from "@/components/candidate/use-staged-progress";

/** Turn a failed Laravel call into form state (field errors from 422s). */
function failed(err: unknown, values?: Record<string, string>): ActionState {
  if (err instanceof ApiError) return { ok: false, message: err.message, fieldErrors: err.fieldErrors, values };
  return { ok: false, message: "Something went wrong. Please try again.", values };
}

/** Wrap a client handler for ActionForm: supplies the token and sends 401s back to sign-in. */
function useCandidateAction(run: (token: string, formData: FormData) => Promise<ActionState>) {
  const { state, handleUnauthorized } = useCandidateAuth();
  return async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
    if (state.status !== "authenticated") {
      handleUnauthorized();
      return { ok: false };
    }
    try {
      return await run(state.token, formData);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        handleUnauthorized();
        return { ok: false };
      }
      return failed(err, Object.fromEntries([...formData.entries()].map(([k, v]) => [k, String(v)])));
    }
  };
}

/** Message for a failed call, with Laravel's field error for `field` preferred when present. */
function errorMessage(err: unknown, field?: string): string {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  return (field && err.fieldErrors[field]?.[0]) || err.message;
}

/** DELETE /resumes/{resume} (204; 409 when a payment references it). */
export function DeleteResumeButton({ resumeId, redirectTo, onDeleted }: { resumeId: string; redirectTo?: string; onDeleted?: () => void }) {
  const router = useRouter();
  const action = useCandidateAction(async (token) => {
    try {
      await api.deleteResume(token, resumeId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) return { ok: false, message: "This resume has a payment, so it can't be deleted." };
      throw err;
    }
    if (redirectTo) router.push(redirectTo);
    else onDeleted?.();
    return { ok: true };
  });
  return (
    <ActionForm action={action} hideMessages>
      <SubmitButton variant="ghost" size="sm" confirm="Delete this resume? This can't be undone." pendingText="Deleting…">
        <Trash2 className="size-4" aria-hidden /> Delete
      </SubmitButton>
      <FormMessage />
    </ActionForm>
  );
}

/**
 * POST /payments { resume_id } → remember data.id (a fallback if Paystack returns without ?reference=),
 * then go to Paystack's hosted checkout. The price shown comes from GET /pricing; Laravel sets the
 * amount actually charged and verifies the payment server-side.
 */
export function PayForReviewButton({ resumeId, className }: { resumeId: string; className?: string }) {
  const pricing = usePricing();
  const { state, handleUnauthorized } = useCandidateAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (busy) return;
    if (state.status !== "authenticated") return handleUnauthorized();
    setBusy(true);
    setError(null);
    try {
      const payment = await api.createPayment(state.token, resumeId);
      savePendingPayment({ paymentId: payment.id });
      window.location.assign(payment.authorizationUrl); // stay busy while the browser navigates away
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
      // 422 errors.resume_id: unreadable resume · 503: payments not configured (Laravel's message).
      setError(errorMessage(err, "resume_id"));
      setBusy(false);
    }
  }

  if (pricing.status === "loading") return <Skeleton className={`h-12 w-full sm:w-64 ${className ?? ""}`} />;
  const unavailable = pricing.status === "error" || !pricing.pricing.available;
  return (
    <div className={className}>
      <Button size="lg" onClick={() => void pay()} loading={busy} disabled={unavailable} className="w-full sm:w-auto">
        {!busy && <CreditCard className="size-4" aria-hidden />}
        {busy ? "Opening secure checkout…" : pricing.status === "ready" && pricing.label ? `Pay ${pricing.label} & review` : "Pay & review"}
      </Button>
      {unavailable && (
        <p className="mt-2 text-sm text-slate-600" role="status">
          Reviews can&apos;t be purchased right now. Please try again later.
        </p>
      )}
      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}
    </div>
  );
}

/**
 * POST /reviews { payment_id } with staged progress. The request is synchronous: it returns once
 * the review has finished, then we move to the results page.
 */
export function StartReviewButton({ paymentId, label = "Start my review", embedded }: { paymentId: number; label?: string; embedded?: boolean }) {
  const router = useRouter();
  const { state, handleUnauthorized } = useCandidateAuth();
  const progress = useStagedProgress(REVIEW_PROGRESS);
  const [error, setError] = useState<{ message: string; used: boolean } | null>(null);

  async function start() {
    if (state.status !== "authenticated") return handleUnauthorized();
    setError(null);
    try {
      const review = await progress.run(() => api.createReview(state.token, paymentId));
      if (!review) return; // already running
      clearPendingPayment();
      router.push(`/dashboard/reviews/${encodeURIComponent(review.id)}`);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
      const message = errorMessage(err, "payment_id");
      setError({ message, used: err instanceof ApiError && err.status === 422 && /already been used/i.test(message) });
    }
  }

  if (progress.phase === "running" || progress.phase === "finishing" || progress.phase === "done") return <ReviewProgress progress={progress} embedded={embedded} />;
  return (
    <div>
      <Button size="lg" onClick={() => void start()} disabled={progress.busy} className="w-full sm:w-auto">
        <Sparkles className="size-4" aria-hidden /> {label}
      </Button>
      {error && (
        <Alert
          tone={error.used ? "info" : "error"}
          className="mt-4 text-left"
          action={
            error.used ? (
              <Link href="/dashboard/reviews" className={buttonClass("outline", "sm")}>
                Open review history
              </Link>
            ) : undefined
          }
        >
          {error.used ? "This payment's review has already been started — you'll find it in your review history." : error.message}
        </Alert>
      )}
    </div>
  );
}

/**
 * POST /reviews/{id}/retry with the same staged progress. Optionally switches to another of the
 * candidate's readable resumes (e.g. a re-exported text-based PDF).
 */
export function RetryReviewButton({ review, onRetried, embedded }: { review: Review; onRetried: (r: Review) => void; embedded?: boolean }) {
  const { state, handleUnauthorized } = useCandidateAuth();
  const progress = useStagedProgress(REVIEW_PROGRESS);
  const [error, setError] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<string>("");
  const resumes = useApi((t) => api.listResumes(t), []);
  const others = (resumes.data?.items ?? []).filter((r) => r.id !== review.resumeId && r.extractionStatus === "succeeded");
  const nextAttempt = (review.attempts ?? 0) + 1;
  const attemptLabel = review.maxAttempts ? `Attempt ${nextAttempt} of ${review.maxAttempts}` : undefined;

  async function retry() {
    if (state.status !== "authenticated") return handleUnauthorized();
    setError(null);
    try {
      const result = await progress.run(() => api.retryReview(state.token, review.id, resumeId || undefined));
      if (!result) return; // already running
      onRetried(result);
      progress.reset(); // if the retry failed again, show the (updated) retry option instead of "complete"
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
      setError(errorMessage(err, "review"));
    }
  }

  if (progress.busy || progress.phase === "done") return <ReviewProgress progress={progress} title="Retrying your review" subtitle={attemptLabel} embedded={embedded} />;
  return (
    <div className="space-y-4 text-left">
      {others.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="retry-resume" className="block text-sm font-medium text-slate-800">
            Resume to review
          </label>
          <select
            id="retry-resume"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="block w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-base shadow-xs focus:border-brand-600 focus:ring-4 focus:ring-brand-600/15 focus:outline-none sm:text-sm"
          >
            <option value="">The same resume{review.resumeName ? ` (${review.resumeName})` : ""}</option>
            {others.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fileName}
              </option>
            ))}
          </select>
        </div>
      )}
      <Button size="lg" onClick={() => void retry()} disabled={progress.busy} className="w-full sm:w-auto">
        <RotateCcw className="size-4" aria-hidden /> Retry review
      </Button>
      {attemptLabel && <p className="text-xs text-slate-500">This will be {attemptLabel.toLowerCase()}.</p>}
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}

const optional = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

/** PATCH /profile. */
export function ProfileForm({ profile, onSaved }: { profile: Candidate; onSaved?: (p: Candidate) => void }) {
  const { refreshUser } = useCandidateAuth();
  const action = useCandidateAction(async (token, fd) => {
    const saved = await api.updateProfile(token, {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: optional(fd.get("phone")),
      location: optional(fd.get("location")),
      professional_title: optional(fd.get("professional_title")),
    });
    if (saved) onSaved?.(saved);
    void refreshUser();
    return { ok: true, message: "Profile saved." };
  });
  return (
    <ActionForm action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Full name" required defaultValue={profile.name} autoComplete="name" />
        <TextField name="email" type="email" label="Email" required defaultValue={profile.email} autoComplete="email" />
        <TextField name="phone" type="tel" label="Phone" defaultValue={profile.phone} autoComplete="tel" />
        <TextField name="location" label="Location" defaultValue={profile.location} placeholder="e.g. Lagos, Nigeria" />
        <div className="sm:col-span-2">
          <TextField
            name="professional_title"
            label="Professional title"
            defaultValue={profile.professionalTitle}
            placeholder="e.g. Customer Success Specialist"
          />
        </div>
      </div>
      <div className="flex justify-end border-t border-line pt-5">
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </div>
    </ActionForm>
  );
}

/** Calls `onTick` on an interval while mounted (stops after ~3 minutes). */
export function AutoRefresh({ onTick, intervalMs = 4000, maxTries = 45 }: { onTick: () => void; intervalMs?: number; maxTries?: number }) {
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  }, [onTick]);
  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      if (tries > maxTries) return clearInterval(t);
      tick.current();
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, maxTries]);
  return null;
}
