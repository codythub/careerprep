import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type Client = Prisma.TransactionClient | typeof db;

export async function notify(
  userId: string,
  input: { type: NotificationType; title: string; body: string; link?: string },
  client: Client = db,
) {
  return client.notification.create({ data: { userId, ...input } });
}

export async function markNotificationRead(userId: string, id: string) {
  // Scoped by userId: users can only touch their own notifications.
  return db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
