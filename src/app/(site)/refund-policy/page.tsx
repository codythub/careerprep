import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Refund Policy", alternates: { canonical: "/refund-policy" } };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="30 September 2026">
      <p>We want you to feel confident ordering from {siteConfig.name}. This policy explains when refunds are available.</p>
      <h2>Before work starts</h2>
      <p>
        If your order is paid but our team has not yet started reviewing it (status <strong>Paid</strong> or{" "}
        <strong>Received</strong>), you can request a full refund.
      </p>
      <h2>After work has started</h2>
      <p>
        Once your order is <strong>In Review</strong> or later, work has begun and refunds are assessed case by case. If
        something isn&apos;t right, tell us — we&apos;ll first offer a revision to address specific, reasonable feedback.
      </p>
      <h2>What is not grounds for a refund</h2>
      <ul>
        <li>Not receiving interviews or job offers. Resume optimization does not guarantee employment outcomes.</li>
        <li>Changing your target role after the work is completed (we can discuss a new order).</li>
      </ul>
      <h2>Duplicate or failed payments</h2>
      <p>
        If you were charged more than once for the same order, or charged for an order that could not be processed, we will
        refund the extra payment in full.
      </p>
      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> with your order number (for example
        RO-2026-XXXXXX). Approved refunds go back to the original payment method through Paystack. Timing depends on your bank
        or card provider.
      </p>
    </LegalPage>
  );
}
