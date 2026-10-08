"use client";

import { Flag } from "lucide-react";
import { ActionForm, Honeypot, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { reportJobAction } from "@/server/actions/jobs";
import { REPORT_REASON_LABEL, options } from "@/lib/labels";

export function ReportJobForm({ jobId }: { jobId: string }) {
  return (
    <details className="group card">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium text-slate-700 hover:text-slate-950">
        <Flag className="size-4" aria-hidden /> Report this job
      </summary>
      <div className="border-t border-slate-100 p-4">
        <ActionForm action={reportJobAction} className="relative space-y-4">
          <Honeypot />
          <input type="hidden" name="jobId" value={jobId} />
          <SelectField name="reason" label="What's wrong?" required options={options(REPORT_REASON_LABEL)} placeholder="Choose a reason" />
          <TextAreaField name="details" label="Details (optional)" rows={3} maxLength={2000} />
          <TextField name="reporterEmail" type="email" label="Your email (optional)" hint="Only used if we need to follow up." />
          <SubmitButton variant="secondary" size="sm" pendingText="Sending…">
            Send report
          </SubmitButton>
        </ActionForm>
      </div>
    </details>
  );
}
