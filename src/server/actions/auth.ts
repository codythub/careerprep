"use server";

/**
 * LEGACY admin authentication (Next.js admin panel only).
 * Candidate auth (register/login/logout) lives in ./candidate.ts and talks to Laravel.
 */
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionState } from "@/lib/action-state";
import { safeCallbackPath } from "@/lib/url";
import { formDataToObject, loginSchema } from "@/lib/validation";
import { fromZodError, formValues } from "@/server/errors";

export async function adminLoginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  delete values.password;
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  const callbackUrl = safeCallbackPath(String(formData.get("callbackUrl") ?? ""), "/admin");
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: "Incorrect email or password, or too many attempts. Please try again.", values };
    }
    throw err; // NEXT_REDIRECT on success
  }
  return { ok: true };
}

export async function adminSignOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
