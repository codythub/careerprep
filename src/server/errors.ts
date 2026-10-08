import type { ZodError } from "zod";
import type { ActionState } from "@/lib/action-state";

export type { ActionState };

/** An error whose message is safe to show to the user. Anything else is logged and hidden. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}


export function fromZodError(error: ZodError, values?: Record<string, string>): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors, values };
}

/** Convert an unknown thrown value into a user-safe ActionState. */
export function toActionError(err: unknown): ActionState {
  if (err instanceof UserError) return { ok: false, message: err.message };
  // Re-throw Next.js control-flow errors (redirect / notFound).
  if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_")) {
    throw err;
  }
  console.error(err);
  return { ok: false, message: "Something went wrong on our side. Please try again." };
}

export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}
