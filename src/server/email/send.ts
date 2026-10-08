import "server-only";
import { Resend } from "resend";
import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import type { EmailMessage } from "@/server/email/templates";

let resend: Resend | null = null;

/**
 * Send a transactional email. Never throws: email failures are logged and must
 * not break the workflow that triggered them (payments, order updates, etc.).
 * Without RESEND_API_KEY (local development) the message is logged instead.
 */
export async function sendEmail(to: string, message: EmailMessage): Promise<{ sent: boolean }> {
  const from = env.emailFrom ?? `${siteConfig.name} <no-reply@${siteConfig.domain}>`;
  if (!env.resendApiKey) {
    if (!env.isProduction && process.env.NODE_ENV !== "test") {
      console.info(`[email:dev] to=${to} subject="${message.subject}"\n${message.text}\n`);
    }
    return { sent: false };
  }
  try {
    resend ??= new Resend(env.resendApiKey);
    const { error } = await resend.emails.send({ from, to, subject: message.subject, html: message.html, text: message.text });
    if (error) {
      console.error("[email] Resend error", error.name, error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false };
  }
}
