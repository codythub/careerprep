/**
 * External URL safety. Only public http(s) URLs are accepted for job application
 * links and company websites — no javascript:, data:, credentials or private hosts.
 */
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?$)|^172\.(1[6-9]|2\d|3[01])\./i;

export function isSafeExternalUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  if (PRIVATE_HOST.test(url.hostname)) return false;
  if (!url.hostname.includes(".")) return false;
  return true;
}

export function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

/** Only allow same-site relative redirects (prevents open redirects after login). */
export function safeCallbackPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
