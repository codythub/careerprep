import type { Role } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import type { successStorySchema, testimonialSubmissionSchema } from "@/lib/validation";
import { UserError } from "@/server/errors";
import { audit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { track } from "@/server/analytics";
import { PAID_STATUSES } from "@/server/services/order-status";

type Actor = { id: string; role: Role };

/** Orders that qualify a customer to leave a testimonial. */
export const TESTIMONIAL_ELIGIBLE_STATUSES = ["COMPLETED", "DELIVERED"] as const;

// ── Testimonials ─────────────────────────────────────────────────────────────

export type TestimonialInput = z.infer<typeof testimonialSubmissionSchema>;

export async function submitTestimonial(userId: string, input: TestimonialInput) {
  if (!input.consentToPublish) throw new UserError("We need your consent to publish your testimonial.");
  if (!(await rateLimit("testimonial", `user:${userId}`))) throw new UserError("Please try again later.");
  const order = await db.resumeOrder.findFirst({
    where: { id: input.orderId, userId },
    select: { id: true, status: true, testimonial: { select: { id: true } } },
  });
  if (!order) throw new UserError("Order not found.");
  if (!(TESTIMONIAL_ELIGIBLE_STATUSES as readonly string[]).includes(order.status)) {
    throw new UserError("You can share a testimonial once your order has been delivered.");
  }
  if (order.testimonial) throw new UserError("You've already shared a testimonial for this order. Thank you!");

  const testimonial = await db.testimonial.create({
    data: {
      userId,
      orderId: order.id,
      name: input.name,
      jobTitle: input.jobTitle,
      company: input.company,
      content: input.content,
      consentToPublish: true,
      // Verified = tied to a genuine, paid platform order (checked above).
      isVerified: true,
      status: "PENDING",
    },
  });
  await track("testimonial_submission", { userId, props: { testimonialId: testimonial.id } });
  return testimonial;
}

export async function publicTestimonials(limit = 6) {
  return db.testimonial.findMany({
    where: { status: "APPROVED", consentToPublish: true },
    orderBy: [{ isFeatured: "desc" }, { date: "desc" }],
    take: limit,
    select: { id: true, name: true, jobTitle: true, company: true, imageUrl: true, content: true, date: true, isVerified: true },
  });
}

export async function adminModerateTestimonial(
  admin: Actor,
  id: string,
  action: "approve" | "reject" | "feature" | "unfeature" | "delete",
) {
  assertAdmin(admin);
  const t = await db.testimonial.findUnique({ where: { id } });
  if (!t) throw new UserError("Testimonial not found.");
  switch (action) {
    case "approve":
      if (!t.consentToPublish) throw new UserError("This testimonial has no publishing consent and cannot be approved.");
      await db.testimonial.update({ where: { id }, data: { status: "APPROVED" } });
      break;
    case "reject":
      await db.testimonial.update({ where: { id }, data: { status: "REJECTED", isFeatured: false } });
      break;
    case "feature":
      if (t.status !== "APPROVED") throw new UserError("Only approved testimonials can be featured.");
      await db.testimonial.update({ where: { id }, data: { isFeatured: true } });
      break;
    case "unfeature":
      await db.testimonial.update({ where: { id }, data: { isFeatured: false } });
      break;
    case "delete":
      await db.testimonial.delete({ where: { id } });
      break;
  }
  await audit(admin.id, `testimonial.${action}`, "Testimonial", id);
}

// ── Success stories ──────────────────────────────────────────────────────────

export type SuccessStoryInput = z.infer<typeof successStorySchema>;

async function resolveStoryUser(email: string | undefined): Promise<string | null> {
  if (!email) return null;
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (!user) throw new UserError("No customer account exists with that email.");
  return user.id;
}

function storyData(input: SuccessStoryInput) {
  return {
    candidateName: input.candidateName,
    careerField: input.careerField,
    previousSituation: input.previousSituation,
    serviceUsed: input.serviceUsed,
    targetRole: input.targetRole,
    improvements: input.improvements,
    journey: input.journey,
    outcome: input.outcome,
    newRole: input.newRole ?? null,
    company: input.company ?? null,
    testimonial: input.testimonial ?? null,
    consentToPublish: input.consentToPublish,
    isVerified: input.isVerified,
    verificationNote: input.verificationNote ?? null,
  };
}

export async function adminSaveStory(admin: Actor, input: SuccessStoryInput, id?: string) {
  assertAdmin(admin);
  const userId = await resolveStoryUser(input.userEmail);
  if (id) {
    const existing = await db.successStory.findUnique({ where: { id } });
    if (!existing) throw new UserError("Story not found.");
    const stillPublishable = input.consentToPublish && input.isVerified && !!userId;
    const story = await db.successStory.update({
      where: { id },
      data: {
        ...storyData(input),
        userId,
        // Editing away consent/verification immediately unpublishes the story.
        ...(existing.status === "APPROVED" && !stillPublishable ? { status: "PENDING", publishedAt: null, isFeatured: false } : {}),
      },
    });
    await audit(admin.id, "story.update", "SuccessStory", id);
    return story;
  }
  const slug = await uniqueSlug(`${input.candidateName} ${input.targetRole}`, async (s) => !!(await db.successStory.findUnique({ where: { slug: s } })));
  const story = await db.successStory.create({ data: { ...storyData(input), userId, slug, status: "PENDING" } });
  await audit(admin.id, "story.create", "SuccessStory", story.id);
  return story;
}

/**
 * Publication rules: a story can only be approved when it is linked to a real customer
 * who paid for a service, has recorded consent, and has been verified by an admin.
 */
export async function adminModerateStory(
  admin: Actor,
  id: string,
  action: "approve" | "reject" | "feature" | "unfeature" | "delete",
) {
  assertAdmin(admin);
  const story = await db.successStory.findUnique({ where: { id } });
  if (!story) throw new UserError("Story not found.");
  switch (action) {
    case "approve": {
      if (!story.userId) throw new UserError("Link the story to the customer's account before approving.");
      const paidOrders = await db.resumeOrder.count({ where: { userId: story.userId, status: { in: PAID_STATUSES } } });
      if (paidOrders === 0) throw new UserError("The linked account has no paid orders — only real customers can be featured.");
      if (!story.consentToPublish) throw new UserError("Record the customer's consent before approving.");
      if (!story.isVerified) throw new UserError("Verify the outcome before approving.");
      await db.successStory.update({ where: { id }, data: { status: "APPROVED", publishedAt: story.publishedAt ?? new Date() } });
      break;
    }
    case "reject":
      await db.successStory.update({ where: { id }, data: { status: "REJECTED", isFeatured: false } });
      break;
    case "feature":
      if (story.status !== "APPROVED") throw new UserError("Only approved stories can be featured.");
      await db.successStory.update({ where: { id }, data: { isFeatured: true } });
      break;
    case "unfeature":
      await db.successStory.update({ where: { id }, data: { isFeatured: false } });
      break;
    case "delete":
      await db.successStory.delete({ where: { id } });
      break;
  }
  await audit(admin.id, `story.${action}`, "SuccessStory", id);
}

/** Defence in depth: public queries re-check every publication condition. */
export const publicStoryWhere = {
  status: "APPROVED",
  consentToPublish: true,
  isVerified: true,
  userId: { not: null },
} as const;

export async function publicStories(limit?: number) {
  return db.successStory.findMany({
    where: publicStoryWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
}
