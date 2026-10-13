import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/format";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

/** Square icon tile used on cards and list rows (reference style). */
export function IconTile({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "neutral" | "dark"; className?: string }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    neutral: "bg-white text-slate-600 ring-line",
    dark: "bg-slate-900 text-white ring-slate-900",
  };
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset [&_svg]:size-5", tones[tone], className)} aria-hidden>
      {children}
    </span>
  );
}

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-slate-700 ring-line-strong",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
  info: "bg-sky-50 text-sky-900 ring-sky-200",
  accent: "bg-brand-600 text-white ring-brand-600",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type AlertTone = "info" | "success" | "warning" | "error";
const alertStyles: Record<AlertTone, { cls: string; icon: string; Icon: typeof Info }> = {
  info: { cls: "border-sky-200 bg-sky-50 text-sky-950", icon: "text-sky-600", Icon: Info },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: "text-emerald-600", Icon: CheckCircle2 },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-950", icon: "text-amber-600", Icon: AlertTriangle },
  error: { cls: "border-red-200 bg-red-50 text-red-950", icon: "text-red-600", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { cls, icon, Icon } = alertStyles[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", cls, className)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="tile px-6 py-12 text-center sm:py-16">
      {icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs ring-1 ring-line [&_svg]:size-5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, center }: { eyebrow?: string; title: string; description?: ReactNode; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow text-brand-700">{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}

/** Single statistic: label, value and an optional hint (dashboard overview). */
export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {icon && <span className="text-slate-400 [&_svg]:size-4" aria-hidden>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-950 sm:text-3xl">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Placeholder block for loading states. Purely decorative. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} aria-hidden />;
}

/** Horizontally scrolling table wrapper so tables never break mobile layouts. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface [&_tbody_tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-[0.06em] [&_th]:text-slate-500 [&_th]:uppercase [&_thead]:bg-surface [&_tr]:border-b [&_tr]:border-line">
        {children}
      </table>
    </div>
  );
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{k}</dt>
          <dd className="mt-1 font-medium break-words text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
