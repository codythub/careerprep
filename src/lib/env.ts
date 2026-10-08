import "server-only";

/**
 * Server-side environment access. Secrets are only ever read here, never in
 * client components. Optional integrations degrade gracefully in development.
 */
function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export const env = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get siteUrl() {
    return (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get paystackSecretKey() {
    return read("PAYSTACK_SECRET_KEY");
  },
  get supabaseUrl() {
    return read("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return read("SUPABASE_SERVICE_ROLE_KEY");
  },
  get storageDriver(): "supabase" | "local" {
    const explicit = read("STORAGE_DRIVER");
    if (explicit === "supabase" || explicit === "local") return explicit;
    return read("SUPABASE_URL") && read("SUPABASE_SERVICE_ROLE_KEY") ? "supabase" : "local";
  },
  get storageSigningSecret() {
    // Local driver signs download URLs with the auth secret.
    return read("AUTH_SECRET") ?? "dev-only-insecure-secret";
  },
  get resendApiKey() {
    return read("RESEND_API_KEY");
  },
  get emailFrom() {
    return read("EMAIL_FROM");
  },
  get adminAlertEmail() {
    return read("ADMIN_ALERT_EMAIL");
  },
  get cronSecret() {
    return read("CRON_SECRET");
  },
};
