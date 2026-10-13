import Link from "next/link";
import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger" | "inverse" | "outlineInverse";
type Variant = ButtonVariant;
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 select-none disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800",
  secondary: "bg-slate-900 text-white shadow-xs hover:bg-slate-800",
  outline: "border border-line-strong bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-surface",
  ghost: "text-slate-700 hover:bg-surface-2 hover:text-slate-950",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700",
  // For brand/dark backgrounds
  inverse: "bg-white text-brand-700 shadow-xs hover:bg-brand-50",
  outlineInverse: "border border-white/50 text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

/** Button with an optional busy state: shows a spinner, keeps its width and blocks repeat clicks. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  loading,
  disabled,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
