"use client";

import { createContext, useActionState, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>(initialActionState);

/**
 * Progressive-enhancement form bound to a server action via useActionState.
 * Children read field errors / echoed values from context.
 */
export function ActionForm({
  action,
  children,
  className,
  successMessage,
  hideMessages,
  encType,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  successMessage?: string;
  hideMessages?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={className} encType={encType} noValidate>
        {!hideMessages && state.message && (
          <Alert tone={state.ok ? "success" : "error"} className="mb-4">
            {state.message}
          </Alert>
        )}
        {!hideMessages && state.ok && !state.message && successMessage && (
          <Alert tone="success" className="mb-4">
            {successMessage}
          </Alert>
        )}
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

/** Inline status line (for compact forms such as table-row actions). */
export function FormMessage({ className }: { className?: string }) {
  const state = useContext(FormStateContext);
  if (!state.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={cn("mt-1 text-xs", state.ok ? "text-emerald-700" : "text-red-600", className)}>
      {state.message}
    </p>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useContext(FormStateContext);
  const errors = state.fieldErrors?.[name];
  const echoed = state.ok ? undefined : state.values?.[name];
  return { errors, value: echoed ?? (defaultValue == null ? undefined : String(defaultValue)) };
}

const inputCls =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:bg-slate-50 sm:text-sm aria-[invalid=true]:border-red-400";

function FieldShell({
  id,
  label,
  hint,
  errors,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  errors?: string[];
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !errors?.length && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

type BaseFieldProps = { name: string; label: string; hint?: ReactNode; required?: boolean };

export function TextField({
  name,
  label,
  hint,
  required,
  defaultValue,
  ...rest
}: BaseFieldProps & Omit<ComponentProps<"input">, "name" | "defaultValue"> & { defaultValue?: string | number | null }) {
  const id = useId();
  const { errors, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} required={required}>
      <input
        id={id}
        name={name}
        defaultValue={value}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={inputCls}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  defaultValue,
  rows = 5,
  ...rest
}: BaseFieldProps & Omit<ComponentProps<"textarea">, "name" | "defaultValue"> & { defaultValue?: string | null }) {
  const id = useId();
  const { errors, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} required={required}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={value}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined}
        required={required}
        className={inputCls}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  defaultValue,
  options,
  placeholder,
  ...rest
}: BaseFieldProps &
  Omit<ComponentProps<"select">, "name" | "defaultValue"> & {
    defaultValue?: string | null;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  }) {
  const id = useId();
  const { errors, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} required={required}>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        aria-invalid={errors?.length ? true : undefined}
        required={required}
        className={inputCls}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: ReactNode;
  defaultChecked?: boolean;
  hint?: ReactNode;
}) {
  const id = useId();
  const state = useContext(FormStateContext);
  const errors = state.fieldErrors?.[name];
  const echoed = state.ok ? undefined : state.values?.[name];
  const checked = echoed !== undefined ? echoed === "on" : defaultChecked;
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={checked}
          aria-invalid={errors?.length ? true : undefined}
          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-700 accent-brand-700"
        />
        <label htmlFor={id} className="text-sm leading-snug text-slate-700">
          {label}
        </label>
      </div>
      {hint && <p className="pl-7 text-xs text-slate-500">{hint}</p>}
      {errors?.length ? <p className="pl-7 text-xs text-red-600">{errors[0]}</p> : null}
    </div>
  );
}

export function FileField({
  name,
  label,
  hint,
  required,
  accept,
}: BaseFieldProps & { accept: string }) {
  const id = useId();
  const state = useContext(FormStateContext);
  const errors = state.fieldErrors?.[name];
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors} required={required}>
      <input
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-medium file:text-slate-800 hover:file:bg-slate-200"
      />
    </FieldShell>
  );
}

/** Invisible field for bots (honeypot). Humans never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  confirm,
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Ask for confirmation before submitting (destructive actions). */
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={buttonClass(variant, size, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? (pendingText ?? "Please wait…") : children}
    </button>
  );
}
