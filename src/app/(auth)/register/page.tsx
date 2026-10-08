import type { Metadata } from "next";
import Link from "next/link";
import { CheckboxField, SubmitButton, TextField } from "@/components/ui/form";
import { RegisterForm } from "@/components/candidate/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Free to join. Upload your resume and get an automated assessment.</p>
      <RegisterForm className="mt-6 space-y-4">
        <TextField name="name" label="Full name" autoComplete="name" required />
        <TextField name="email" type="email" label="Email" autoComplete="email" required />
        <TextField name="password" type="password" label="Password" autoComplete="new-password" required />
        <TextField name="password_confirmation" type="password" label="Confirm password" autoComplete="new-password" required />
        <CheckboxField
          name="acceptTerms"
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-brand-700 underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-brand-700 underline">
                Privacy Policy
              </Link>
              .
            </>
          }
        />
        <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </RegisterForm>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </>
  );
}
