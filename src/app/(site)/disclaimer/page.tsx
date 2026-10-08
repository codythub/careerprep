import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Disclaimer", alternates: { canonical: "/disclaimer" } };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="30 September 2026">
      <h2>Employment outcomes</h2>
      <p>
        {siteConfig.name} helps you present your experience more effectively and find opportunities. We do not guarantee
        interviews, job offers, salaries or any other employment outcome.
      </p>
      <h2>Resume optimization</h2>
      <p>
        We rewrite and restructure the information you give us. You are responsible for making sure your final resume is
        accurate. We will not add experience, qualifications or results you haven&apos;t provided.
      </p>
      <h2>Third-party jobs and employer-provided information</h2>
      <p>
        Job listings come from employers and third-party sources. We review listings before publishing, but details such as
        salary, eligibility, closing dates and requirements are provided by employers and may change. You apply on the
        employer&apos;s own website, and we are not part of their hiring process.
      </p>
      <p>
        <strong>Remote does not mean Nigeria-eligible.</strong> We show a Nigeria Eligible label only when our team has
        confirmed eligibility. Always confirm with the employer.
      </p>
      <h2>Job scam warning</h2>
      <p>
        Legitimate employers do not charge applicants. Never pay for a job, training, equipment or &quot;processing&quot;, and
        never share bank logins or card details. Report suspicious listings to us immediately.
      </p>
      <h2>User-submitted content</h2>
      <p>
        Testimonials and success stories come from real customers with their consent and are reviewed by our team. They
        reflect individual experiences; your results may differ.
      </p>
      <h2>Career guides</h2>
      <p>Our guides are general information, not legal, financial or immigration advice.</p>
    </LegalPage>
  );
}
