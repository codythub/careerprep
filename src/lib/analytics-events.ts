/** Allow-list of analytics event names (shared by client beacon + server sink). */
export const ANALYTICS_EVENTS = [
  "homepage_view",
  "resume_cta_click",
  "resume_checkout_started",
  "resume_payment_successful",
  "job_view",
  "job_search",
  "job_filter",
  "job_apply_click",
  "job_saved",
  "employer_submission",
  "testimonial_submission",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Events a browser may report directly. Business events are recorded server-side only. */
export const CLIENT_EVENTS: readonly AnalyticsEventName[] = ["homepage_view", "resume_cta_click", "job_filter"];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}
