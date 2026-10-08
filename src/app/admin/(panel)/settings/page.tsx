import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import { Badge, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { SettingsForm } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";
import { getResumePriceKobo } from "@/server/services/settings";
import { isPaystackConfigured } from "@/server/paystack";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const priceKobo = await getResumePriceKobo();
  const integrations: Array<[string, boolean, string]> = [
    ["Paystack", isPaystackConfigured(), "PAYSTACK_SECRET_KEY"],
    ["Supabase Storage", env.storageDriver === "supabase", "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"],
    ["Resend email", !!env.resendApiKey, "RESEND_API_KEY / EMAIL_FROM"],
    ["Admin alerts", !!env.adminAlertEmail, "ADMIN_ALERT_EMAIL"],
    ["Daily cron", !!env.cronSecret, "CRON_SECRET"],
  ];
  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardBody>
          <h2 className="mb-4 font-semibold">Pricing</h2>
          <SettingsForm priceNaira={priceKobo / 100} />
          <p className="mt-3 text-xs text-slate-500">Each order stores the price at the time it was created. Changing it never affects existing orders.</p>
        </CardBody>
      </Card>
      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-4 font-semibold">Integrations</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {integrations.map(([name, ok, vars]) => (
              <li key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="font-medium">{name}</span>
                  <span className="block font-mono text-xs text-slate-500">{vars}</span>
                </span>
                <Badge tone={ok ? "success" : "warning"}>{ok ? "Configured" : "Not configured"}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Branding (name, tagline, support email, social links) lives in <code>src/config/site.ts</code>. Current name: {siteConfig.name}.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
