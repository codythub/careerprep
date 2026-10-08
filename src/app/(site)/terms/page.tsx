import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="30 September 2026">
      <p>
        These terms apply when you use {siteConfig.name}. By creating an account, ordering a service or posting a job, you
        agree to them.
      </p>
      <h2>1. Our services</h2>
      <p>
        We provide resume optimization, a job listing board and career guidance content. We are not a recruitment agency
        and we are not an employer. We do not apply for jobs on your behalf.
      </p>
      <h2>2. No guarantee of employment</h2>
      <p>
        Resume optimization improves how your experience is presented.{" "}
        <strong>It does not guarantee interviews, job offers, or any particular salary or outcome.</strong> Hiring decisions
        are made solely by employers.
      </p>
      <h2>3. Resume optimization</h2>
      <ul>
        <li>You must provide accurate information. We will not invent experience, qualifications or results.</li>
        <li>You are responsible for reviewing your final resume and making sure everything in it is true.</li>
        <li>Work begins after payment is confirmed. Turnaround times are estimates, not guarantees.</li>
        <li>You may upload PDF or Word (.docx) files only, and you confirm you have the right to share their contents with us.</li>
      </ul>
      <h2>4. Payments</h2>
      <p>
        Prices are shown in Nigerian Naira and charged through Paystack. An order is only marked as paid after we verify
        the payment with Paystack. Refunds are covered by our <Link href="/refund-policy">refund policy</Link>.
      </p>
      <h2>5. Job listings</h2>
      <p>
        Listings are provided by employers or sourced by our team from third parties. We review listings, but we cannot
        guarantee that every detail is accurate, current or complete. Always verify an employer before sharing personal
        information. <strong>Never pay anyone to get a job.</strong> Report suspicious listings with the “Report this job” button.
      </p>
      <p>
        A job marked <em>Remote</em> is not necessarily open to applicants in Nigeria. We only show <em>Nigeria Eligible</em>{" "}
        when our team has confirmed it, and eligibility can still change, so check with the employer.
      </p>
      <h2>6. Employers</h2>
      <ul>
        <li>You must be authorised to advertise the role, and the role must be genuine.</li>
        <li>You must never charge applicants any fee.</li>
        <li>We may edit listings for clarity, ask for more information, decline, or remove any listing at our discretion.</li>
      </ul>
      <h2>7. User-submitted content</h2>
      <p>
        If you submit a testimonial or agree to a success story, you confirm it is truthful and give us permission to
        publish it with the details you consented to. You can ask us to remove it at any time.
      </p>
      <h2>8. Acceptable use</h2>
      <p>
        Do not misuse the platform: no fraudulent listings, spam, attempts to access other users&apos; data, or interference
        with the service. We may suspend accounts that break these terms.
      </p>
      <h2>9. Liability</h2>
      <p>
        We provide the platform with reasonable care and skill. To the extent permitted by law, we are not liable for
        decisions made by employers, for the content of third-party listings, or for indirect losses. Nothing in these
        terms limits rights you have under applicable consumer protection law.
      </p>
      <h2>10. Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
      </p>
    </LegalPage>
  );
}
