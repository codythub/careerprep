/** Shape returned by every form server action (safe to import in client components). */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Echo of submitted values so forms can repopulate after a validation error. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = { ok: false };
