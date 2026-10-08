import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/format";
import { accent } from "@/lib/accents";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-100",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type AlertTone = "info" | "success" | "warning" | "error";
const alertStyles: Record<AlertTone, { cls: string; Icon: typeof Info }> = {
  info: { cls: "border-sky-200 bg-sky-50 text-sky-900", Icon: Info },
  success: { cls: "border-emerald-200 bg-emerald-50 text-emerald-900", Icon: CheckCircle2 },
  warning: { cls: "border-amber-200 bg-amber-50 text-amber-900", Icon: AlertTriangle },
  error: { cls: "border-red-200 bg-red-50 text-red-900", Icon: XCircle },
};

export function Alert({ tone = "info", title, children, className }: { tone?: AlertTone; title?: string; children?: ReactNode; className?: string }) {
  const { cls, Icon } = alertStyles[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, center }: { eyebrow?: string; title: string; description?: ReactNode; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
      <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}

export function StatCard({ label, value, hint, accentIndex }: { label: string; value: ReactNode; hint?: string; accentIndex?: number }) {
  const a = accentIndex === undefined ? null : accent(accentIndex);
  return (
    <Card className={a ? `border-t-4 ${a.top}` : undefined}>
      <CardBody className="p-4 sm:p-5">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", a?.text)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </CardBody>
    </Card>
  );
}

/** Horizontal-scrolling wrapper so admin tables never break mobile layouts. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto card">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_thead]:bg-slate-50 [&_tr]:border-b [&_tr]:border-slate-100 [&_tbody_tr:last-child]:border-0">
        {children}
      </table>
    </div>
  );
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-slate-500">{k}</dt>
          <dd className="mt-0.5 break-words font-medium text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
