"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/action-state";
import { articleSchema, formDataToObject, jobSchema, optionalText, settingsSchema, successStorySchema } from "@/lib/validation";
import { fromZodError, formValues, toActionError } from "@/server/errors";
import { requireAdmin } from "@/server/session";
import { audit } from "@/server/audit";
import { validateImageUpload, validateResumeUpload } from "@/server/uploads";
import { buildObjectKey, publicObjectUrl, putObject } from "@/server/storage";
import { adminChangeOrderStatus, adminUpdateOrderNotes, adminUploadDeliverable } from "@/server/services/orders";
import {
  adminApproveSubmission,
  adminCreateJob,
  adminDeleteJob,
  adminRejectSubmission,
  adminResolveReport,
  adminSetJobStatus,
  adminToggleFeatured,
  adminUpdateJob,
} from "@/server/services/jobs";
import { adminModerateStory, adminModerateTestimonial, adminSaveStory } from "@/server/services/social-proof";
import { adminDeleteArticle, adminSaveArticle, adminSetArticleStatus } from "@/server/services/articles";
import { SETTING_KEYS, setSetting } from "@/server/services/settings";

const id = z.string().min(1).max(40);

function revalidatePublic() {
  revalidatePath("/", "layout");
}

async function uploadPublicImage(file: FormDataEntryValue | null, prefix: string): Promise<string | undefined> {
  const image = await validateImageUpload(file);
  if (!image) return undefined;
  const key = buildObjectKey(prefix, image.fileName);
  await putObject("public", key, image.bytes, image.mimeType);
  return publicObjectUrl(key);
}

// ── Orders ───────────────────────────────────────────────────────────────────

const orderStatusSchema = z.object({
  orderId: id,
  status: z.enum(["RECEIVED", "IN_REVIEW", "PROCESSING", "COMPLETED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  note: optionalText(500),
});

export async function changeOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = orderStatusSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await adminChangeOrderStatus(admin, parsed.data.orderId, parsed.data.status, parsed.data.note);
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    revalidatePath("/admin/orders");
    return { ok: true, message: "Status updated and customer notified." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateOrderNotesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ orderId: id, internalNotes: optionalText(10000), profileRecommendations: optionalText(10000) })
    .safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, formValues(formData));
  try {
    await adminUpdateOrderNotes(admin, parsed.data.orderId, parsed.data);
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { ok: true, message: "Notes saved." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function uploadDeliverableAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ orderId: id, type: z.enum(["PDF", "DOCX"]) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Choose the file type." };
  try {
    const file = await validateResumeUpload(formData.get("file"));
    await adminUploadDeliverable(admin, parsed.data.orderId, parsed.data.type, file);
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { ok: true, message: `${parsed.data.type} uploaded.` };
  } catch (err) {
    return toActionError(err);
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function setUserRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ userId: id, role: z.enum(["USER", "ADMIN"]) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  if (parsed.data.userId === admin.id) return { ok: false, message: "You can't change your own role." };
  await db.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  await audit(admin.id, "user.role", "User", parsed.data.userId, { role: parsed.data.role });
  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated." };
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export async function saveJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const values = formValues(formData);
  const jobId = formData.get("jobId");
  const parsed = jobSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  let savedId: string;
  try {
    const job = typeof jobId === "string" && jobId ? await adminUpdateJob(admin, jobId, parsed.data) : await adminCreateJob(admin, parsed.data);
    savedId = job.id;
  } catch (err) {
    return { ...toActionError(err), values };
  }
  revalidatePath("/admin/jobs");
  revalidatePublic();
  if (typeof jobId === "string" && jobId) return { ok: true, message: "Job saved." };
  redirect(`/admin/jobs/${savedId}?created=1`);
}

export async function jobStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ jobId: id, op: z.enum(["publish", "unpublish", "expire", "feature", "delete"]) })
    .safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { jobId, op } = parsed.data;
  try {
    if (op === "publish") await adminSetJobStatus(admin, jobId, "PUBLISHED");
    else if (op === "unpublish") await adminSetJobStatus(admin, jobId, "DRAFT");
    else if (op === "expire") await adminSetJobStatus(admin, jobId, "EXPIRED");
    else if (op === "feature") await adminToggleFeatured(admin, jobId);
    else if (op === "delete") await adminDeleteJob(admin, jobId);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/jobs");
  revalidatePublic();
  if (op === "delete") redirect("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  return { ok: true, message: "Job updated." };
}

// ── Submissions & reports ────────────────────────────────────────────────────

export async function approveSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ submissionId: id, categoryId: id }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Choose a category before approving." };
  let jobId: string;
  try {
    jobId = (await adminApproveSubmission(admin, parsed.data.submissionId, parsed.data.categoryId)).id;
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/submissions");
  redirect(`/admin/jobs/${jobId}?fromSubmission=1`);
}

export async function rejectSubmissionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ submissionId: id, reason: optionalText(1000) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    await adminRejectSubmission(admin, parsed.data.submissionId, parsed.data.reason);
    revalidatePath("/admin/submissions");
    return { ok: true, message: "Submission rejected and employer notified." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function resolveReportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ reportId: id, status: z.enum(["ACTIONED", "DISMISSED"]) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  await adminResolveReport(admin, parsed.data.reportId, parsed.data.status);
  revalidatePath("/admin/reports");
  return { ok: true, message: "Report updated." };
}

// ── Testimonials & stories ───────────────────────────────────────────────────

const moderation = z.enum(["approve", "reject", "feature", "unfeature", "delete"]);

export async function moderateTestimonialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ id, op: moderation }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    await adminModerateTestimonial(admin, parsed.data.id, parsed.data.op);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/testimonials");
  revalidatePublic();
  return { ok: true, message: "Testimonial updated." };
}

export async function testimonialImageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const tId = id.safeParse(formData.get("id"));
  if (!tId.success) return { ok: false, message: "Invalid request." };
  try {
    const url = await uploadPublicImage(formData.get("image"), "testimonials");
    if (!url) return { ok: false, message: "Choose an image." };
    await db.testimonial.update({ where: { id: tId.data }, data: { imageUrl: url } });
    await audit(admin.id, "testimonial.image", "Testimonial", tId.data);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/testimonials");
  revalidatePublic();
  return { ok: true, message: "Image updated." };
}

export async function saveStoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const values = formValues(formData);
  const storyId = formData.get("storyId");
  const parsed = successStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  let savedId: string;
  try {
    const story = await adminSaveStory(admin, parsed.data, typeof storyId === "string" && storyId ? storyId : undefined);
    const imageUrl = await uploadPublicImage(formData.get("image"), "stories");
    if (imageUrl) await db.successStory.update({ where: { id: story.id }, data: { candidateImageUrl: imageUrl } });
    savedId = story.id;
  } catch (err) {
    return { ...toActionError(err), values };
  }
  revalidatePath("/admin/stories");
  revalidatePublic();
  if (typeof storyId === "string" && storyId) return { ok: true, message: "Story saved." };
  redirect(`/admin/stories/${savedId}?created=1`);
}

export async function moderateStoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ id, op: moderation }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    await adminModerateStory(admin, parsed.data.id, parsed.data.op);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/stories");
  revalidatePublic();
  if (parsed.data.op === "delete") redirect("/admin/stories");
  revalidatePath(`/admin/stories/${parsed.data.id}`);
  return { ok: true, message: "Story updated." };
}

// ── Career guides ────────────────────────────────────────────────────────────

export async function saveArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const values = formValues(formData);
  const articleId = formData.get("articleId");
  const parsed = articleSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, values);
  let savedId: string;
  try {
    const cover = await uploadPublicImage(formData.get("coverImage"), "articles");
    const article = await adminSaveArticle(admin, parsed.data, typeof articleId === "string" && articleId ? articleId : undefined, cover);
    savedId = article.id;
  } catch (err) {
    return { ...toActionError(err), values };
  }
  revalidatePath("/admin/guides");
  revalidatePublic();
  if (typeof articleId === "string" && articleId) return { ok: true, message: "Article saved." };
  redirect(`/admin/guides/${savedId}?created=1`);
}

export async function articleStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ id, op: z.enum(["publish", "unpublish", "delete"]) }).safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  try {
    if (parsed.data.op === "delete") await adminDeleteArticle(admin, parsed.data.id);
    else await adminSetArticleStatus(admin, parsed.data.id, parsed.data.op === "publish");
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/admin/guides");
  revalidatePublic();
  if (parsed.data.op === "delete") redirect("/admin/guides");
  revalidatePath(`/admin/guides/${parsed.data.id}`);
  return { ok: true, message: "Article updated." };
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error, formValues(formData));
  const priceKobo = parsed.data.resumePriceNaira * 100;
  await setSetting(SETTING_KEYS.resumePriceKobo, priceKobo);
  await audit(admin.id, "settings.update", "Setting", "platform", { resumePriceKobo: priceKobo });
  revalidatePublic();
  return { ok: true, message: "Settings saved. New orders will use the updated price; existing orders keep their original price." };
}
