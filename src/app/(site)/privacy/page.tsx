import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="30 September 2026">
      <p>
        This policy explains what personal information {siteConfig.name} (&quot;we&quot;, &quot;us&quot;) collects, why we
        collect it and how we protect it. We process personal data in line with applicable Nigerian data protection law,
        including the Nigeria Data Protection Act 2023.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password (stored only as a secure hash).</li>
        <li><strong>Profile details you choose to add:</strong> phone number, location, headline, target role, LinkedIn and portfolio links, job preferences.</li>
        <li><strong>Resume files:</strong> documents you upload for optimization, and the final files we prepare for you.</li>
        <li><strong>Order and payment records:</strong> order details, payment references and status. Card details are handled by Paystack; we never see or store your full card number.</li>
        <li><strong>Job activity:</strong> jobs you save, applications you track and reports you submit.</li>
        <li><strong>Employer submissions:</strong> company and recruiter details provided when posting a job.</li>
        <li><strong>Usage information:</strong> basic first-party analytics such as page views and clicks on job application links, used to improve the service.</li>
      </ul>
      <h2>How we use your information</h2>
      <ul>
        <li>To provide the resume optimization service you ordered and deliver your files.</li>
        <li>To process and verify payments.</li>
        <li>To operate your account, saved jobs and application tracker.</li>
        <li>To send transactional emails and in-app notifications about your account and orders.</li>
        <li>To review job listings and keep the job board safe.</li>
        <li>To comply with legal obligations and prevent fraud or abuse.</li>
      </ul>
      <p>We do not sell your personal information. We do not share your resume with employers unless you ask us to.</p>
      <h2>How we protect your resume</h2>
      <p>
        Resume files are stored in private storage and are never published at a public web address. When you download a
        file, we first confirm you are allowed to access it and then generate a link that expires after a short time.
        Only you and authorised members of our team can access your files.
      </p>
      <h2>Service providers</h2>
      <p>We use trusted providers to run the platform, including:</p>
      <ul>
        <li>Paystack — payment processing</li>
        <li>Vercel — website hosting</li>
      </ul>
      <p>These providers process data on our behalf and only as needed to provide their services.</p>
      <h2>How long we keep information</h2>
      <p>
        We keep account and order information while your account is active and for as long as needed for legal,
        accounting and dispute-resolution purposes. You can ask us to delete your account and resume files at any time.
      </p>
      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your personal data, and you can object to certain
        processing. To make a request, email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
      </p>
      <h2>Cookies</h2>
      <p>We use essential cookies to keep you signed in and to protect forms. We do not use third-party advertising cookies.</p>
      <h2>Changes</h2>
      <p>We may update this policy. We&apos;ll change the date above and, for significant changes, let account holders know.</p>
    </LegalPage>
  );
}
