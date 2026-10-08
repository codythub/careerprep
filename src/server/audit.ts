import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Client = Prisma.TransactionClient | typeof db;

export async function audit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  meta?: Prisma.InputJsonValue,
  client: Client = db,
) {
  await client.auditLog.create({ data: { actorId, action, entityType, entityId, meta } });
}
