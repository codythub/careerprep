import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { IconTile } from "@/components/ui/primitives";
import { PageIntro } from "@/components/site/page-intro";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <>
      <PageIntro eyebrow="Contact" title="We're happy to help">
        Questions about a review, a payment or your account? Email us and we&apos;ll get back to you.
      </PageIntro>
      <section className="container-page py-12 sm:py-16">
        <div className="max-w-xl">
          <a href={`mailto:${siteConfig.supportEmail}`} className="card card-hover flex items-center gap-4 p-5 sm:p-6">
            <IconTile>
              <Mail />
            </IconTile>
            <span className="min-w-0">
              <span className="block text-sm text-slate-500">Email</span>
              <span className="block truncate font-semibold text-slate-950">{siteConfig.supportEmail}</span>
            </span>
          </a>
          <p className="mt-6 text-sm leading-relaxed text-slate-500">
            For a review or payment question, include the email on your account and, if you have it, your Paystack payment reference
            (it starts with <span className="font-mono text-slate-700">CP-</span>).
          </p>
        </div>
      </section>
    </>
  );
}
