"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { employerSubmissionSchema, formDataToObject, jobReportSchema } from "@/lib/validation";
import { fromZodError, formValues, toActionError } from "@/server/errors";
import { clientIpFromHeaders } from "@/server/request";
import { reportJob, submitEmployerJob } from "@/server/services/jobs";

export async function reportJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  const parsed = jobReportSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  try {
    // Reports are anonymous on the public site (candidate accounts live in Laravel).
    const ip = clientIpFromHeaders(await headers());
    await reportJob(parsed.data, null, ip);
    return { ok: true, message: "Thank you. Our team will review this listing." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function submitEmployerJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData);
  const parsed = employerSubmissionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  try {
    const ip = clientIpFromHeaders(await headers());
    await submitEmployerJob(parsed.data, ip);
  } catch (err) {
    return toActionError(err);
  }
  redirect("/employers/post-job/submitted");
}
