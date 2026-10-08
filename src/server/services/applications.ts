import type { ApplicationStatus } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import type { applicationSchema } from "@/lib/validation";
import { UserError } from "@/server/errors";

export type ApplicationInput = z.infer<typeof applicationSchema>;

export async function createApplication(userId: string, input: ApplicationInput) {
  let jobId: string | null = null;
  if (input.jobId) {
    const job = await db.job.findUnique({ where: { id: input.jobId }, select: { id: true } });
    jobId = job?.id ?? null;
    if (jobId) {
      const dup = await db.application.findFirst({ where: { userId, jobId }, select: { id: true } });
      if (dup) throw new UserError("This job is already in your application tracker.");
    }
  }
  return db.application.create({
    data: {
      userId,
      jobId,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      applyUrl: input.applyUrl ?? null,
      status: input.status,
      appliedAt: input.appliedAt ?? (input.status === "APPLIED" ? new Date() : null),
      notes: input.notes ?? null,
    },
  });
}

/** All mutations are scoped by userId so users can only change their own records. */
export async function updateApplicationStatus(userId: string, id: string, status: ApplicationStatus) {
  const app = await db.application.findFirst({ where: { id, userId }, select: { appliedAt: true } });
  if (!app) throw new UserError("Application not found.");
  await db.application.update({
    where: { id },
    data: { status, ...(status === "APPLIED" && !app.appliedAt ? { appliedAt: new Date() } : {}) },
  });
}

export async function updateApplicationNotes(userId: string, id: string, notes: string | undefined) {
  const res = await db.application.updateMany({ where: { id, userId }, data: { notes: notes ?? null } });
  if (res.count === 0) throw new UserError("Application not found.");
}

export async function deleteApplication(userId: string, id: string) {
  const res = await db.application.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new UserError("Application not found.");
}
