"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import { setToken } from "@/lib/laravel/token";
import { safeCallbackPath } from "@/lib/url";
import { ActionForm } from "@/components/ui/form";
import { useRedirectIfSignedIn } from "@/components/candidate/auth";

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function failed(err: unknown, values: Record<string, string>): ActionState {
  if (err instanceof ApiError) return { ok: false, message: err.message, fieldErrors: err.fieldErrors, values };
  return { ok: false, message: "Something went wrong. Please try again.", values };
}

/** POST /auth/login → store the bearer token client-side → go to the dashboard (or callbackUrl). */
export function LoginForm({ callbackUrl, children, className }: { callbackUrl?: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  const to = safeCallbackPath(callbackUrl);
  useRedirectIfSignedIn(to);
  async function action(_prev: ActionState, fd: FormData): Promise<ActionState> {
    const email = text(fd, "email");
    const password = String(fd.get("password") ?? "");
    const fieldErrors: Record<string, string[]> = {};
    if (!email) fieldErrors.email = ["Enter your email address."];
    if (!password) fieldErrors.password = ["Enter your password."];
    if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, values: { email } };
    try {
      const { token } = await api.login({ email, password });
      setToken(token);
      router.replace(to);
      return { ok: true };
    } catch (err) {
      return failed(err, { email });
    }
  }
  return (
    <ActionForm action={action} className={className}>
      {children}
    </ActionForm>
  );
}

/** POST /auth/register → store the bearer token client-side → go to the dashboard. */
export function RegisterForm({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter();
  useRedirectIfSignedIn();
  async function action(_prev: ActionState, fd: FormData): Promise<ActionState> {
    const values = { name: text(fd, "name"), email: text(fd, "email") };
    const password = String(fd.get("password") ?? "");
    const password_confirmation = String(fd.get("password_confirmation") ?? "");
    const fieldErrors: Record<string, string[]> = {};
    if (!values.name) fieldErrors.name = ["Enter your full name."];
    if (!values.email) fieldErrors.email = ["Enter your email address."];
    if (!password) fieldErrors.password = ["Choose a password."];
    if (password !== password_confirmation) fieldErrors.password_confirmation = ["Passwords don't match."];
    if (fd.get("acceptTerms") !== "on") fieldErrors.acceptTerms = ["Please accept the Terms and Privacy Policy."];
    if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, values };
    try {
      const { token } = await api.register({ ...values, password, password_confirmation });
      setToken(token);
      router.replace("/dashboard");
      return { ok: true };
    } catch (err) {
      return failed(err, values);
    }
  }
  return (
    <ActionForm action={action} className={className}>
      {children}
    </ActionForm>
  );
}
