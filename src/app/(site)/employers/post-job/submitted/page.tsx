import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Job submitted", robots: { index: false } };

export default function SubmittedPage() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden />
        <h1 className="mt-4 text-3xl font-semibold">Thanks — your job is pending review</h1>
        <p className="mt-3 text-slate-600">
          We&apos;ve emailed you a confirmation. Our team reviews every listing before it&apos;s published and may contact you to
          confirm details. You&apos;ll hear from us once it&apos;s approved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href="/employers/post-job" variant="outline">
            Post another job
          </LinkButton>
          <LinkButton href="/">Back to home</LinkButton>
        </div>
      </div>
    </div>
  );
}
