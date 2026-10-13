/** Only allow same-site relative redirects (prevents open redirects after login). */
export function safeCallbackPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
