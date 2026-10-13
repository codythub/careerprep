import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/primitives";
import { SubmitButton, TextField } from "@/components/ui/form";
import { LoginForm } from "@/components/candidate/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined;
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-600">Sign in to upload resumes, run reviews and see your results.</p>
      {sp.expired === "1" && (
        <Alert tone="warning" className="mt-5">
          Your session has expired. Please sign in again.
        </Alert>
      )}
      {sp.signedOut === "1" && (
        <Alert tone="success" className="mt-5">
          You&apos;ve been signed out.
        </Alert>
      )}
      <LoginForm callbackUrl={callbackUrl} className="mt-6 space-y-5">
        <TextField name="email" type="email" label="Email" autoComplete="email" required />
        <TextField name="password" type="password" label="Password" autoComplete="current-password" required />
        <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </LoginForm>
      <p className="mt-6 border-t border-line pt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create a free account
        </Link>
      </p>
    </>
  );
}
