import { describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { routeAccess } from "@/lib/route-access";
import { safeCallbackPath } from "@/lib/url";
import { registerSchema } from "@/lib/validation";
import {
  changePassword,
  createPasswordResetToken,
  registerUser,
  resetPasswordWithToken,
  verifyCredentials,
} from "@/server/services/auth";
import { UserError } from "@/server/errors";
import { createUser } from "./helpers";

const authMock = vi.hoisted(() => ({ session: null as null | { user: { id: string; role: string } } }));
vi.mock("@/auth", () => ({ auth: async () => authMock.session }));

describe("registration", () => {
  it("creates a USER with a bcrypt hash (never the plain password)", async () => {
    const user = await registerUser({ name: "Ada Obi", email: "ada@example.com", password: "s3cure-password" }, "1.1.1.1");
    expect(user.role).toBe("USER");
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(row.passwordHash).not.toContain("s3cure-password");
  });

  it("rejects duplicate emails", async () => {
    await registerUser({ name: "A", email: "dup@example.com", password: "password-123" }, "1.1.1.2");
    await expect(registerUser({ name: "B", email: "dup@example.com", password: "password-123" }, "1.1.1.3")).rejects.toBeInstanceOf(UserError);
  });

  it("validates input: short passwords, mismatches and missing terms", () => {
    const bad = registerSchema.safeParse({ name: "A", email: "nope", password: "short", confirmPassword: "x", acceptTerms: null });
    expect(bad.success).toBe(false);
    const good = registerSchema.safeParse({ name: "Ada", email: "ADA@Example.com ", password: "password-123", confirmPassword: "password-123", acceptTerms: "on" });
    expect(good.success).toBe(true);
    expect(good.data?.email).toBe("ada@example.com");
  });

  it("rate limits registrations per IP", async () => {
    const ip = "9.9.9.9";
    for (let i = 0; i < 5; i++) await registerUser({ name: "U", email: `rl${i}@example.com`, password: "password-123" }, ip);
    await expect(registerUser({ name: "U", email: "rl6@example.com", password: "password-123" }, ip)).rejects.toThrow(/Too many/);
  });
});

describe("login (credentials)", () => {
  it("accepts the correct password and returns the role", async () => {
    const user = await createUser({ email: "login@example.com" }, "my-password-1");
    const result = await verifyCredentials({ email: "login@example.com", password: "my-password-1" }, "2.2.2.2");
    expect(result).toMatchObject({ id: user.id, role: "USER" });
  });

  it("rejects a wrong password or unknown email with the same null result", async () => {
    await createUser({ email: "login2@example.com" }, "my-password-1");
    expect(await verifyCredentials({ email: "login2@example.com", password: "wrong" }, "2.2.2.3")).toBeNull();
    expect(await verifyCredentials({ email: "ghost@example.com", password: "whatever" }, "2.2.2.4")).toBeNull();
  });

  it("locks out after too many attempts for one email", async () => {
    await createUser({ email: "brute@example.com" }, "right-password");
    for (let i = 0; i < 10; i++) await verifyCredentials({ email: "brute@example.com", password: "wrong" }, `3.3.3.${i}`);
    expect(await verifyCredentials({ email: "brute@example.com", password: "right-password" }, "3.3.4.1")).toBeNull();
  });
});

describe("password reset", () => {
  it("resets once with a valid token and invalidates it", async () => {
    await createUser({ email: "reset@example.com" }, "old-password-1");
    const token = await createPasswordResetToken("reset@example.com");
    expect(token).toBeTruthy();
    await resetPasswordWithToken(token!, "new-password-1");
    expect(await verifyCredentials({ email: "reset@example.com", password: "new-password-1" }, "4.4.4.4")).not.toBeNull();
    await expect(resetPasswordWithToken(token!, "another-pass-1")).rejects.toThrow(/invalid or has expired/);
  });

  it("does not reveal unknown emails", async () => {
    expect(await createPasswordResetToken("nobody@example.com")).toBeNull();
  });

  it("requires the current password to change it", async () => {
    const user = await createUser({}, "current-pass-1");
    await expect(changePassword(user.id, "wrong", "next-pass-123")).rejects.toThrow(/incorrect/);
    await changePassword(user.id, "current-pass-1", "next-pass-123");
  });
});

describe("protected routes (proxy gate)", () => {
  const anon = { adminRole: null };

  it("gates only the legacy admin area on the server", () => {
    expect(routeAccess("/admin", anon)).toBe("adminLogin");
    expect(routeAccess("/admin/login", anon)).toBe("allow");
    // Candidate auth is a browser-held Laravel bearer token; /dashboard guards itself client-side.
    expect(routeAccess("/dashboard", anon)).toBe("allow");
    expect(routeAccess("/login", anon)).toBe("allow");
  });

  it("keeps the legacy admin role check and leaves public pages open", () => {
    expect(routeAccess("/admin/orders", { adminRole: "USER" })).toBe("forbidden");
    expect(routeAccess("/admin/jobs", { adminRole: "ADMIN" })).toBe("allow");
    expect(routeAccess("/jobs", anon)).toBe("allow");
    expect(routeAccess("/administrator-guide", anon)).toBe("allow");
  });

  it("only allows same-site callback redirects", () => {
    expect(safeCallbackPath("/dashboard/orders")).toBe("/dashboard/orders");
    expect(safeCallbackPath("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackPath("//evil.example")).toBe("/dashboard");
  });
});

describe("server-side admin authorization", () => {
  it("requireAdmin re-checks the role in the database, ignoring the session's claim", async () => {
    const { requireAdmin } = await import("@/server/session");
    const user = await createUser();
    // Even if a token claimed ADMIN, the DB role (USER) wins → 404.
    authMock.session = { user: { id: user.id, role: "ADMIN" } };
    await expect(requireAdmin()).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });

  it("requireAdmin redirects anonymous users to login", async () => {
    const { requireAdmin } = await import("@/server/session");
    authMock.session = null;
    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("requireAdmin passes for a real admin", async () => {
    const { requireAdmin } = await import("@/server/session");
    const admin = await createUser({ role: "ADMIN" });
    authMock.session = { user: { id: admin.id, role: "USER" } };
    await expect(requireAdmin()).resolves.toMatchObject({ id: admin.id, role: "ADMIN" });
  });
});
