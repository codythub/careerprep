import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * LEGACY admin identity (Next.js admin area only). Candidates authenticate with Laravel —
 * see src/components/candidate/auth.tsx (browser-held bearer token).
 *
 * Server-side identity. The JWT only identifies the user; role and existence are
 * always re-read from the database so demotions/deletions take effect immediately.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(callbackPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(callbackPath ? `/login?callbackUrl=${encodeURIComponent(callbackPath)}` : "/login");
  }
  return user;
}

/** Admin gate for pages and server actions. Non-admins get a 404 (no hint the area exists). */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?callbackUrl=%2Fadmin");
  if (user.role !== "ADMIN") notFound();
  return user;
}
