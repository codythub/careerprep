"use client";

import { ActionForm, CheckboxField, Honeypot, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { submitEmployerJobAction } from "@/server/actions/jobs";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LEVEL_LABEL, WORK_MODE_LABEL, options } from "@/lib/labels";

export function PostJobForm() {
  return (
    <ActionForm action={submitEmployerJobAction} className="relative space-y-8">
      <Honeypot />
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Company</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="companyName" label="Company name" required maxLength={120} />
          <TextField name="companyWebsite" type="url" label="Company website" placeholder="https://" required />
          <TextField name="recruiterName" label="Recruiter name" required autoComplete="name" />
          <TextField name="recruiterEmail" type="email" label="Recruiter email" required autoComplete="email" hint="Preferably on your company domain." />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Role</legend>
        <TextField name="jobTitle" label="Job title" required maxLength={140} />
        <TextAreaField name="jobDescription" label="Job description" rows={7} required hint="What the role is, the team and what success looks like. Markdown supported." />
        <TextAreaField name="responsibilities" label="Responsibilities" rows={5} hint="One per line." />
        <TextAreaField name="requirements" label="Requirements" rows={5} hint="One per line." />
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField name="workMode" label="Work arrangement" required options={options(WORK_MODE_LABEL)} placeholder="Choose…" />
          <SelectField name="employmentType" label="Employment type" required options={options(EMPLOYMENT_TYPE_LABEL)} placeholder="Choose…" />
          <SelectField name="experienceLevel" label="Experience level" required options={options(EXPERIENCE_LEVEL_LABEL)} placeholder="Choose…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="location"
            label="Location / eligibility"
            required
            placeholder="e.g. Remote — open to Nigeria; or Lagos, Nigeria"
            hint="Where must candidates be based? Be specific."
          />
          <TextField name="salary" label="Salary (optional)" placeholder="e.g. $1,500–2,000/month or ₦600,000/month" />
          <TextField name="applyUrl" type="url" label="Application URL" required placeholder="https://" hint="Your official careers page or ATS link." />
          <TextField name="closingDate" type="date" label="Closing date (optional)" />
        </div>
      </fieldset>

      <div className="space-y-3 rounded-lg bg-slate-50 p-4">
        <CheckboxField
          name="confirmLegitimate"
          label="I confirm this is a genuine vacancy, I'm authorised to advertise it, and applicants will never be asked to pay any fee."
        />
      </div>

      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Submitting…">
        Submit for review
      </SubmitButton>
    </ActionForm>
  );
}
