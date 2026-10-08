import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { successStorySchema, testimonialSubmissionSchema } from "@/lib/validation";
import {
  adminModerateStory,
  adminModerateTestimonial,
  adminSaveStory,
  publicStories,
  publicTestimonials,
  submitTestimonial,
} from "@/server/services/social-proof";
import { createAdmin, createOrder, createUser } from "./helpers";

const content = "The rewrite made my experience much clearer and easier to read.";
const tInput = (orderId: string, name: string, consentToPublish: boolean) => ({
  orderId,
  name,
  content,
  consentToPublish,
  jobTitle: undefined,
  company: undefined,
});

describe("testimonials", () => {
  it("only customers with a completed/delivered order can submit", async () => {
    const user = await createUser();
    const pending = await createOrder(user.id, "PROCESSING");
    await expect(submitTestimonial(user.id, tInput(pending.id, "Ada", true))).rejects.toThrow(/once your order has been delivered/);

    const delivered = await createOrder(user.id, "DELIVERED");
    const t = await submitTestimonial(user.id, tInput(delivered.id, "Ada", true));
    expect(t.status).toBe("PENDING");
    expect(t.isVerified).toBe(true);
    expect(t.orderId).toBe(delivered.id);
  });

  it("cannot submit for someone else's order or twice for the same order", async () => {
    const owner = await createUser();
    const other = await createUser();
    const order = await createOrder(owner.id, "DELIVERED");
    await expect(submitTestimonial(other.id, tInput(order.id, "X", true))).rejects.toThrow(/Order not found/);
    await submitTestimonial(owner.id, tInput(order.id, "Ada", true));
    await expect(submitTestimonial(owner.id, tInput(order.id, "Ada", true))).rejects.toThrow(/already shared/);
  });

  it("requires consent", async () => {
    expect(testimonialSubmissionSchema.safeParse({ orderId: "x", name: "Ada", content, consentToPublish: null }).success).toBe(false);
    const user = await createUser();
    const order = await createOrder(user.id, "DELIVERED");
    await expect(submitTestimonial(user.id, tInput(order.id, "Ada", false))).rejects.toThrow(/consent/);
  });

  it("only APPROVED testimonials are public; featuring requires approval", async () => {
    const admin = await createAdmin();
    const user = await createUser();
    const order = await createOrder(user.id, "DELIVERED");
    const t = await submitTestimonial(user.id, tInput(order.id, "Ada", true));
    expect(await publicTestimonials()).toHaveLength(0);
    await expect(adminModerateTestimonial(admin, t.id, "feature")).rejects.toThrow(/Only approved/);
    await adminModerateTestimonial(admin, t.id, "approve");
    expect(await publicTestimonials()).toHaveLength(1);
    await adminModerateTestimonial(admin, t.id, "reject");
    expect(await publicTestimonials()).toHaveLength(0);
    expect(await db.auditLog.count({ where: { entityId: t.id } })).toBe(2);
  });

  it("a testimonial without consent can never be approved", async () => {
    const admin = await createAdmin();
    const t = await db.testimonial.create({ data: { name: "No consent", content, consentToPublish: false } });
    await expect(adminModerateTestimonial(admin, t.id, "approve")).rejects.toThrow(/consent/);
  });
});

function storyInput(overrides: Record<string, unknown> = {}) {
  return successStorySchema.parse({
    candidateName: "Chidi O.",
    careerField: "Data",
    previousSituation: "Applying for analyst roles for months without responses.",
    serviceUsed: "Resume Optimization",
    targetRole: "Data Analyst",
    improvements: "Resume restructured around measurable analysis projects.",
    journey: "Applied to twelve roles, reached final interviews at two companies.",
    outcome: "Accepted a data analyst offer.",
    consentToPublish: "on",
    isVerified: "on",
    ...overrides,
  });
}

describe("success stories", () => {
  it("cannot be approved without a linked paying customer", async () => {
    const admin = await createAdmin();
    const story = await adminSaveStory(admin, storyInput());
    await expect(adminModerateStory(admin, story.id, "approve")).rejects.toThrow(/Link the story/);

    const nonCustomer = await createUser();
    const linked = await adminSaveStory(admin, storyInput({ userEmail: nonCustomer.email }));
    await expect(adminModerateStory(admin, linked.id, "approve")).rejects.toThrow(/no paid orders/);
  });

  it("requires consent and verification before approval", async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    await createOrder(customer.id, "DELIVERED");
    const noConsent = await adminSaveStory(admin, storyInput({ userEmail: customer.email, consentToPublish: null }));
    await expect(adminModerateStory(admin, noConsent.id, "approve")).rejects.toThrow(/consent/);
    const unverified = await adminSaveStory(admin, storyInput({ userEmail: customer.email, isVerified: null }));
    await expect(adminModerateStory(admin, unverified.id, "approve")).rejects.toThrow(/Verify/);
  });

  it("publishes when every condition is met, and unpublishes if consent is withdrawn", async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    await createOrder(customer.id, "DELIVERED");
    const story = await adminSaveStory(admin, storyInput({ userEmail: customer.email }));
    expect(await publicStories()).toHaveLength(0);
    await adminModerateStory(admin, story.id, "approve");
    expect(await publicStories()).toHaveLength(1);

    await adminSaveStory(admin, storyInput({ userEmail: customer.email, consentToPublish: null }), story.id);
    const after = await db.successStory.findUniqueOrThrow({ where: { id: story.id } });
    expect(after.status).toBe("PENDING");
    expect(await publicStories()).toHaveLength(0);
  });

  it("public queries re-check conditions even if a row is forced to APPROVED", async () => {
    const s = storyInput();
    await db.successStory.create({
      data: {
        slug: "forced",
        status: "APPROVED",
        consentToPublish: false,
        isVerified: true,
        candidateName: s.candidateName,
        careerField: s.careerField,
        previousSituation: s.previousSituation,
        serviceUsed: s.serviceUsed,
        targetRole: s.targetRole,
        improvements: s.improvements,
        journey: s.journey,
        outcome: s.outcome,
      },
    });
    expect(await publicStories()).toHaveLength(0);
  });
});
