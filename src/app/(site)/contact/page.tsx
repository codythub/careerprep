import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Contact us</h1>
        <p className="mt-4 text-lg text-slate-600">Questions about an order, a job listing or your account? We&apos;re happy to help.</p>
        <a
          href={`mailto:${siteConfig.supportEmail}`}
          className="mt-8 flex items-center gap-4 card p-6 card-hover"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Mail className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm text-slate-500">Email</span>
            <span className="block truncate font-semibold">{siteConfig.supportEmail}</span>
          </span>
        </a>
        <p className="mt-6 text-sm text-slate-500">
          For order questions, include your order number (RO-…). To report a suspicious job, use the “Report this job” button
          on the listing so our team sees it right away.
        </p>
      </div>
    </div>
  );
}
