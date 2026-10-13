"use client";

import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { usePricing } from "@/lib/laravel/use-pricing";
import { buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/format";

/**
 * Review price as text, from GET /pricing. Shows a skeleton while loading and `fallback`
 * when pricing is unavailable — never a hard-coded amount.
 */
export function PriceText({ fallback = "", className }: { fallback?: string; className?: string }) {
  const pricing = usePricing();
  // Inline (span) placeholder: PriceText often sits inside a <p>, where a <div> is invalid HTML.
  if (pricing.status === "loading") return <span className={cn("inline-block h-[0.9em] w-16 animate-pulse rounded bg-surface-2 align-middle", className)} aria-hidden />;
  const label = pricing.status === "ready" ? pricing.label : null;
  return <span className={className}>{label ?? fallback}</span>;
}

/** Call-to-action button text that includes the live price when known. */
export function ReviewCtaLabel({ base = "Review my resume" }: { base?: string }) {
  const pricing = usePricing();
  const label = pricing.status === "ready" ? pricing.label : null;
  return <>{label ? `${base} · ${label}` : base}</>;
}

const FEATURES = ["Overall and category scores", "Weaknesses explained clearly", "Practical recommendations", "Downloadable report", "Saved to your review history"];

/** Single plan card. Price and availability come from GET /pricing. */
export function PricingCard({ className }: { className?: string }) {
  const pricing = usePricing();
  const ready = pricing.status === "ready" && pricing.pricing.available && pricing.label;
  return (
    <div className={cn("card relative overflow-hidden p-6 shadow-sm sm:p-8", className)}>
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-600" aria-hidden />
      <p className="eyebrow text-brand-700">Resume review</p>
      <div className="mt-3 flex items-baseline gap-2" aria-live="polite">
        {pricing.status === "loading" ? (
          <Skeleton className="h-11 w-36" />
        ) : ready ? (
          <>
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-slate-950 sm:text-5xl">{pricing.label}</span>
            <span className="text-sm text-slate-500">per review</span>
          </>
        ) : (
          <span className="text-lg font-semibold text-slate-700">Pricing unavailable right now</span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">One-time payment. No subscription.</p>
      <ul className="mt-6 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {f}
          </li>
        ))}
      </ul>
      {ready ? (
        <Link href="/dashboard/resumes" className={buttonClass("primary", "lg", "mt-8 w-full")}>
          Get started
        </Link>
      ) : (
        <span className={buttonClass("primary", "lg", "mt-8 w-full")} aria-disabled="true">
          {pricing.status === "loading" ? "Loading price…" : "Checkout unavailable"}
        </span>
      )}
      <ul className="mt-5 space-y-2 border-t border-line pt-5 text-xs text-slate-500">
        <li className="flex items-center gap-2">
          <Lock className="size-3.5 shrink-0" aria-hidden /> Secure checkout with Paystack, verified on our servers
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden /> Your resume is stored privately
        </li>
      </ul>
    </div>
  );
}
