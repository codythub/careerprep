"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";

/** Fire-and-forget beacon to our replaceable first-party analytics endpoint. */
export function trackClient(name: AnalyticsEventName, props?: Record<string, string | number | boolean>) {
  try {
    const body = JSON.stringify({ name, path: window.location.pathname, props });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // analytics must never break the page
  }
}

export function TrackView({ event }: { event: AnalyticsEventName }) {
  useEffect(() => {
    trackClient(event);
  }, [event]);
  return null;
}

export function TrackedLink({ event, ...props }: ComponentProps<typeof Link> & { event: AnalyticsEventName }) {
  return <Link {...props} onClick={() => trackClient(event)} />;
}
