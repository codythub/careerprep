"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { api } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import type { Pricing } from "@/lib/laravel/types";

export type PricingState =
  | { status: "loading" }
  | { status: "ready"; pricing: Pricing; /** e.g. "₦6,000"; null when unavailable */ label: string | null }
  | { status: "error"; message: string };

/** Format an amount in the smallest currency unit (kobo for NGN) for display. */
export function formatPrice(amount: number, currency: string | null): string {
  const major = (amount / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
  if (!currency || currency === "NGN") return `${siteConfig.currencySymbol}${major}`;
  return `${currency} ${major}`;
}

// One request per page load, shared by every component that shows the price.
let cached: Promise<Pricing> | null = null;

function loadPricing(): Promise<Pricing> {
  cached ??= api.pricing().catch((err: unknown) => {
    cached = null; // let a later mount try again
    throw err;
  });
  return cached;
}

/** Review price from GET /pricing (public). Never falls back to a hard-coded amount. */
export function usePricing(): PricingState {
  const [state, setState] = useState<PricingState>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    loadPricing().then(
      (pricing) => {
        if (cancelled) return;
        const label = pricing.available && pricing.amount !== null ? formatPrice(pricing.amount, pricing.currency) : null;
        setState({ status: "ready", pricing, label });
      },
      (err: unknown) => !cancelled && setState({ status: "error", message: err instanceof ApiError ? err.message : "Pricing is unavailable right now." }),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
