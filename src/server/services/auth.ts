import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/server/rate-limit";
import { UserError } from "@/server/errors";

const BCRYPT_COST = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// Hash compared against when the email does not exist, so response time doesn't reveal accounts.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("timing-equaliser", BCRYPT_COST));

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export type AuthenticatedUser = { id: string; email: string; name: string | null; role: Role };

/** Used by the Auth.js credentials provider. Returns null for any failure (no user enumeration). */
export async function verifyCredentials(raw: unknown, ip: string): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const [ipOk, emailOk] = await Promise.all([rateLimit("login", `ip:${ip}`), rateLimit("login", `email:${email}`)]);
  if (!ipOk || !emailOk) return null;

  const user = await db.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !user.passwordHash || !valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function registerUser(input: { name: string; email: string; password: string }, ip: string) {
  if (!(await rateLimit("register", `ip:${ip}`))) {
    throw new UserError("Too many sign-up attempts. Please try again later.");
  }
  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new UserError("An account with this email already exists. Try signing in instead.");
  return db.user.create({
    data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: "USER" },
    select: { id: true, email: true, name: true, role: true },
  });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a one-time reset token. Returns null (silently) if the email is unknown. */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    }),
  ]);
  return token;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expires < new Date()) {
    throw new UserError("This reset link is invalid or has expired. Please request a new one.");
  }
  const passwordHash = await hashPassword(newPassword);
  const [, user] = await db.$transaction([
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: record.userId }, data: { passwordHash }, select: { email: true } }),
  ]);
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new UserError("Your current password is incorrect.");
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  return user.email;
}
