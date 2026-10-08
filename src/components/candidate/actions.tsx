"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Sparkles, Trash2 } from "lucide-react";
import { ActionForm, FormMessage, SubmitButton, TextField } from "@/components/ui/form";
import type { ActionState } from "@/lib/action-state";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { clearPendingPayment, savePendingPayment } from "@/lib/laravel/token";
import type { Candidate } from "@/lib/laravel/types";
import { useCandidateAuth } from "@/components/candidate/auth";

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

/** DELETE /resumes/{resume} (204). */
export function DeleteResumeButton({ resumeId, redirectTo, onDeleted }: { resumeId: string; redirectTo?: string; onDeleted?: () => void }) {
  const router = useRouter();
  const action = useCandidateAction(async (token) => {
    await api.deleteResume(token, resumeId);
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
 * POST /payments { resume_id } → remember data.id (needed to verify after Paystack returns),
 * then go to Paystack's hosted checkout at data.authorization_url.
 */
export function PayForReviewButton({ resumeId, label = "Pay & review this resume" }: { resumeId: string; label?: string }) {
  const action = useCandidateAction(async (token) => {
    const payment = await api.createPayment(token, resumeId);
    savePendingPayment({ paymentId: payment.paymentId, resumeId: Number(resumeId) });
    window.location.assign(payment.authorizationUrl);
    // Keep the button busy while the browser navigates away.
    return new Promise<ActionState>(() => {});
  });
  return (
    <ActionForm action={action}>
      <SubmitButton size="lg" pendingText="Opening secure checkout…">
        <CreditCard className="size-4" aria-hidden /> {label}
      </SubmitButton>
    </ActionForm>
  );
}

/** POST /reviews { payment_id } — Laravel checks the payment is verified and unused. */
export function StartReviewButton({
  paymentId,
  variant = "primary",
  label = "Review My Resume",
}: {
  paymentId: number;
  variant?: "primary" | "outline";
  label?: string;
}) {
  const router = useRouter();
  const action = useCandidateAction(async (token) => {
    const review = await api.createReview(token, paymentId);
    clearPendingPayment();
    router.push(`/dashboard/reviews/${encodeURIComponent(review.id)}`);
    return { ok: true };
  });
  return (
    <ActionForm action={action}>
      <SubmitButton size="lg" variant={variant} pendingText="Starting your review…">
        <Sparkles className="size-4" aria-hidden /> {label}
      </SubmitButton>
    </ActionForm>
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
    <ActionForm action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Full name" required defaultValue={profile.name} autoComplete="name" />
        <TextField name="email" type="email" label="Email" required defaultValue={profile.email} autoComplete="email" />
        <TextField name="phone" type="tel" label="Phone" defaultValue={profile.phone} autoComplete="tel" />
        <TextField name="location" label="Location" defaultValue={profile.location} placeholder="e.g. Lagos, Nigeria" />
        <TextField name="professional_title" label="Professional title" defaultValue={profile.professionalTitle} placeholder="e.g. Customer Success Specialist" />
      </div>
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
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
