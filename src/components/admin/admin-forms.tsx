"use client";

import type { ReactNode } from "react";
import type { ButtonVariant } from "@/components/ui/button";
import {
  ActionForm,
  CheckboxField,
  FileField,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/ui/form";
import {
  approveSubmissionAction,
  changeOrderStatusAction,
  rejectSubmissionAction,
  saveArticleAction,
  saveJobAction,
  saveSettingsAction,
  saveStoryAction,
  testimonialImageAction,
  updateOrderNotesAction,
  uploadDeliverableAction,
} from "@/server/actions/admin";
import type { ActionState } from "@/lib/action-state";
import {
  EMPLOYMENT_TYPE_LABEL,
  EXPERIENCE_LEVEL_LABEL,
  GUIDE_CATEGORY_LABEL,
  ORDER_STATUS_LABEL,
  WORK_MODE_LABEL,
  options,
} from "@/lib/labels";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** One-click admin operation (publish, feature, approve…) with inline feedback. */
export function OpButton({
  action,
  fields,
  children,
  variant = "outline",
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: ButtonVariant;
  confirm?: string;
}) {
  return (
    <ActionForm action={action} hideMessages className="inline-block">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} size="sm" confirm={confirm} pendingText="…">
        {children}
      </SubmitButton>
      <FormMessage />
    </ActionForm>
  );
}


// ── Orders ───────────────────────────────────────────────────────────────────

export function OrderStatusForm({ orderId, allowed }: { orderId: string; allowed: string[] }) {
  if (allowed.length === 0) return <p className="text-sm text-slate-500">This order is closed. No further status changes are possible.</p>;
  return (
    <ActionForm action={changeOrderStatusAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <SelectField
        name="status"
        label="Move order to"
        required
        options={allowed.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s as keyof typeof ORDER_STATUS_LABEL] }))}
        placeholder="Choose status…"
      />
      <TextField name="note" label="Note (optional, internal history)" maxLength={500} />
      <SubmitButton pendingText="Updating…">Update status</SubmitButton>
      <p className="text-xs text-slate-500">&quot;Paid&quot; can only be set by verified Paystack payments. The customer is notified of every change.</p>
    </ActionForm>
  );
}

export function OrderNotesForm({ orderId, internalNotes, profileRecommendations }: { orderId: string; internalNotes: string | null; profileRecommendations: string | null }) {
  return (
    <ActionForm action={updateOrderNotesAction} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <TextAreaField name="internalNotes" label="Internal notes (admin only)" rows={4} defaultValue={internalNotes} />
      <TextAreaField
        name="profileRecommendations"
        label="LinkedIn & profile recommendations (visible to customer once delivered)"
        rows={6}
        defaultValue={profileRecommendations}
      />
      <SubmitButton variant="secondary" pendingText="Saving…">Save notes</SubmitButton>
    </ActionForm>
  );
}

export function DeliverableUploadForm({ orderId }: { orderId: string }) {
  return (
    <ActionForm action={uploadDeliverableAction} className="space-y-3" encType="multipart/form-data">
      <input type="hidden" name="orderId" value={orderId} />
      <SelectField name="type" label="File type" required options={[{ value: "PDF", label: "PDF" }, { value: "DOCX", label: "Word (.docx)" }]} placeholder="Choose…" />
      <FileField name="file" label="Final resume file" required accept=".pdf,.docx" hint="The file's contents must match the selected type." />
      <SubmitButton pendingText="Uploading…">Upload final file</SubmitButton>
    </ActionForm>
  );
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export type JobFormValues = {
  id?: string;
  title?: string;
  companyName?: string;
  companyWebsite?: string | null;
  description?: string;
  responsibilities?: string | null;
  requirements?: string | null;
  applicationInstructions?: string | null;
  categoryId?: string;
  workMode?: string;
  locationEligibility?: string;
  nigeriaEligibility?: string;
  eligibilityNote?: string | null;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  applyUrl?: string;
  closingDate?: string | null;
  isFeatured?: boolean;
  isSponsored?: boolean;
  companyVerified?: boolean;
  companyVerificationNote?: string | null;
};

export function JobForm({ job, categories }: { job: JobFormValues; categories: Array<{ id: string; name: string }> }) {
  return (
    <ActionForm action={saveJobAction} className="space-y-8">
      {job.id && <input type="hidden" name="jobId" value={job.id} />}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Basics</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="title" label="Job title" required defaultValue={job.title} />
          <SelectField name="categoryId" label="Category" required defaultValue={job.categoryId} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Choose…" />
          <TextField name="companyName" label="Company" required defaultValue={job.companyName} />
          <TextField name="companyWebsite" type="url" label="Company website" defaultValue={job.companyWebsite} />
          <SelectField name="employmentType" label="Employment type" required defaultValue={job.employmentType} options={options(EMPLOYMENT_TYPE_LABEL)} placeholder="Choose…" />
          <SelectField name="experienceLevel" label="Experience level" required defaultValue={job.experienceLevel} options={options(EXPERIENCE_LEVEL_LABEL)} placeholder="Choose…" />
        </div>
      </fieldset>

      <fieldset className="space-y-4 card border-amber-200 bg-amber-50/40 p-4">
        <legend className="px-1 text-base font-semibold">Location &amp; Nigeria eligibility</legend>
        <p className="text-sm text-slate-600">
          &quot;Remote&quot; and &quot;Nigeria Eligible&quot; are independent. Only choose <strong>Verified</strong> when you have confirmed the employer accepts Nigeria-based applicants.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="workMode" label="Work arrangement" required defaultValue={job.workMode} options={options(WORK_MODE_LABEL)} placeholder="Choose…" />
          <TextField name="locationEligibility" label="Location eligibility (as stated by employer)" required defaultValue={job.locationEligibility} placeholder="e.g. Worldwide, EMEA, Lagos" />
          <SelectField
            name="nigeriaEligibility"
            label="Nigeria eligibility"
            required
            defaultValue={job.nigeriaEligibility ?? "UNVERIFIED"}
            options={[
              { value: "UNVERIFIED", label: "Unverified — show “Check eligibility before applying”" },
              { value: "VERIFIED", label: "Verified — Nigeria Eligible" },
              { value: "NOT_ELIGIBLE", label: "Not eligible" },
            ]}
          />
          <TextField name="eligibilityNote" label="How was eligibility confirmed?" defaultValue={job.eligibilityNote} hint="Required when Verified (e.g. 'Employer confirmed by email on 2 Oct')." />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Description</legend>
        <TextAreaField name="description" label="Description (Markdown)" rows={8} required defaultValue={job.description} />
        <TextAreaField name="responsibilities" label="Responsibilities (Markdown)" rows={5} defaultValue={job.responsibilities} />
        <TextAreaField name="requirements" label="Requirements (Markdown)" rows={5} defaultValue={job.requirements} />
        <TextAreaField name="applicationInstructions" label="Application instructions" rows={3} defaultValue={job.applicationInstructions} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Salary &amp; dates</legend>
        <div className="grid gap-4 sm:grid-cols-4">
          <TextField name="salaryMin" inputMode="numeric" label="Salary min" defaultValue={job.salaryMin} />
          <TextField name="salaryMax" inputMode="numeric" label="Salary max" defaultValue={job.salaryMax} />
          <SelectField name="salaryCurrency" label="Currency" defaultValue={job.salaryCurrency} options={["NGN", "USD", "GBP", "EUR", "CAD"].map((c) => ({ value: c, label: c }))} placeholder="—" />
          <SelectField name="salaryPeriod" label="Period" defaultValue={job.salaryPeriod} options={[{ value: "HOURLY", label: "Hourly" }, { value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly" }]} placeholder="—" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="applyUrl" type="url" label="Official application URL" required defaultValue={job.applyUrl} />
          <TextField name="closingDate" type="date" label="Closing date" defaultValue={job.closingDate} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-base font-semibold">Verification &amp; promotion</legend>
        <CheckboxField name="companyVerified" label="Employer verified (genuine company, official application link). Required to publish." defaultChecked={job.companyVerified} />
        <TextField name="companyVerificationNote" label="Verification note" defaultValue={job.companyVerificationNote} />
        <CheckboxField name="isFeatured" label="Featured (labelled “Featured”)" defaultChecked={job.isFeatured} />
        <CheckboxField name="isSponsored" label="Sponsored / paid placement (labelled “Sponsored”)" defaultChecked={job.isSponsored} />
      </fieldset>

      <SubmitButton size="lg" pendingText="Saving…">{job.id ? "Save changes" : "Create draft job"}</SubmitButton>
    </ActionForm>
  );
}

// ── Submissions ──────────────────────────────────────────────────────────────

export function SubmissionReviewForms({ submissionId, categories }: { submissionId: string; categories: Array<{ id: string; name: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ActionForm action={approveSubmissionAction} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
        <input type="hidden" name="submissionId" value={submissionId} />
        <SelectField name="categoryId" label="Category" required options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Choose…" />
        <SubmitButton pendingText="Approving…">Approve → create draft job</SubmitButton>
        <p className="text-xs text-slate-500">Creates an unpublished draft. You&apos;ll set eligibility and verification before publishing.</p>
      </ActionForm>
      <ActionForm action={rejectSubmissionAction} className="space-y-3 rounded-lg border border-red-200 bg-red-50/40 p-4">
        <input type="hidden" name="submissionId" value={submissionId} />
        <TextAreaField name="reason" label="Reason (sent to employer)" rows={2} />
        <SubmitButton variant="danger" confirm="Reject this submission?" pendingText="Rejecting…">Reject</SubmitButton>
      </ActionForm>
    </div>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export function TestimonialImageForm({ id }: { id: string }) {
  return (
    <ActionForm action={testimonialImageAction} className="flex flex-wrap items-end gap-2" encType="multipart/form-data">
      <input type="hidden" name="id" value={id} />
      <FileField name="image" label="Profile image (optional)" accept="image/png,image/jpeg,image/webp" />
      <SubmitButton variant="outline" size="sm" pendingText="Uploading…">Upload</SubmitButton>
    </ActionForm>
  );
}

// ── Success stories ──────────────────────────────────────────────────────────

export type StoryFormValues = {
  id?: string;
  userEmail?: string | null;
  candidateName?: string;
  careerField?: string;
  previousSituation?: string;
  serviceUsed?: string;
  targetRole?: string;
  improvements?: string;
  journey?: string;
  outcome?: string;
  newRole?: string | null;
  company?: string | null;
  testimonial?: string | null;
  consentToPublish?: boolean;
  isVerified?: boolean;
  verificationNote?: string | null;
};

export function StoryForm({ story }: { story: StoryFormValues }) {
  return (
    <ActionForm action={saveStoryAction} className="space-y-6" encType="multipart/form-data">
      {story.id && <input type="hidden" name="storyId" value={story.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="userEmail" type="email" label="Customer account email" defaultValue={story.userEmail} hint="Links the story to a real customer (required before approval)." />
        <TextField name="candidateName" label="Candidate name (as they consent to display)" required defaultValue={story.candidateName} />
        <TextField name="careerField" label="Career field" required defaultValue={story.careerField} />
        <TextField name="serviceUsed" label="Service used" required defaultValue={story.serviceUsed ?? "Resume Optimization"} />
        <TextField name="targetRole" label="Target role" required defaultValue={story.targetRole} />
        <TextField name="newRole" label="New role (optional)" defaultValue={story.newRole} />
        <TextField name="company" label="Company (optional, only with consent)" defaultValue={story.company} />
        <FileField name="image" label="Candidate image (optional)" accept="image/png,image/jpeg,image/webp" />
      </div>
      <TextAreaField name="previousSituation" label="Previous situation" rows={3} required defaultValue={story.previousSituation} />
      <TextAreaField name="improvements" label="What was improved" rows={3} required defaultValue={story.improvements} />
      <TextAreaField name="journey" label="Application / interview journey" rows={4} required defaultValue={story.journey} />
      <TextAreaField name="outcome" label="Outcome (factual, as confirmed)" rows={3} required defaultValue={story.outcome} />
      <TextAreaField name="testimonial" label="Candidate quote (optional)" rows={2} defaultValue={story.testimonial} />
      <div className="space-y-3 card border-amber-200 bg-amber-50/40 p-4">
        <CheckboxField name="consentToPublish" label="The customer has given written consent to publish this story with these details." defaultChecked={story.consentToPublish} />
        <CheckboxField name="isVerified" label="I have verified the outcome (e.g. offer letter, LinkedIn update, direct confirmation)." defaultChecked={story.isVerified} />
        <TextField name="verificationNote" label="Verification note (admin only)" defaultValue={story.verificationNote} />
      </div>
      <SubmitButton pendingText="Saving…">{story.id ? "Save story" : "Create story (pending)"}</SubmitButton>
    </ActionForm>
  );
}

// ── Articles ─────────────────────────────────────────────────────────────────

export type ArticleFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published?: boolean;
};

export function ArticleForm({ article }: { article: ArticleFormValues }) {
  return (
    <ActionForm action={saveArticleAction} className="space-y-5" encType="multipart/form-data">
      {article.id && <input type="hidden" name="articleId" value={article.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="title" label="Title" required defaultValue={article.title} />
        <TextField name="slug" label="Slug" defaultValue={article.slug} hint="Leave blank to generate from the title." />
        <SelectField name="category" label="Category" required defaultValue={article.category} options={options(GUIDE_CATEGORY_LABEL)} placeholder="Choose…" />
        <FileField name="coverImage" label="Cover image (optional)" accept="image/png,image/jpeg,image/webp" />
      </div>
      <TextAreaField name="excerpt" label="Excerpt" rows={2} required defaultValue={article.excerpt} maxLength={300} />
      <TextAreaField name="content" label="Content (Markdown)" rows={18} required defaultValue={article.content} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="seoTitle" label="SEO title" defaultValue={article.seoTitle} maxLength={70} />
        <TextField name="seoDescription" label="SEO description" defaultValue={article.seoDescription} maxLength={170} />
      </div>
      <CheckboxField name="publish" label="Published (visible on the website)" defaultChecked={article.published} />
      <SubmitButton pendingText="Saving…">Save article</SubmitButton>
    </ActionForm>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function SettingsForm({ priceNaira }: { priceNaira: number }) {
  return (
    <ActionForm action={saveSettingsAction} className="max-w-md space-y-4">
      <TextField name="resumePriceNaira" inputMode="numeric" label="Resume optimization price (₦)" required defaultValue={priceNaira} />
      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </ActionForm>
  );
}
