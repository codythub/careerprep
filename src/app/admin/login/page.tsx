import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";
import { adminLoginAction } from "@/server/actions/auth";
import { safeCallbackPath } from "@/lib/url";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

/** Legacy admin panel sign-in (separate from candidate sign-in, which uses Laravel). */
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackPath(typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined, "/admin");
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-600">For CareerPrep staff only.</p>
          <ActionForm action={adminLoginAction} className="mt-6 space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <TextField name="email" type="email" label="Email" autoComplete="email" required />
            <TextField name="password" type="password" label="Password" autoComplete="current-password" required />
            <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
              Sign in
            </SubmitButton>
          </ActionForm>
        </div>
      </main>
    </div>
  );
}
