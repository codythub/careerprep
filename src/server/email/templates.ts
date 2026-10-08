import { siteConfig } from "@/config/site";
import { formatNaira } from "@/lib/format";

export type EmailMessage = { subject: string; html: string; text: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Block = { heading: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string };

/** Shared, brand-driven layout. All dynamic values are escaped. */
function render(subject: string, block: Block): EmailMessage {
  const p = block.paragraphs
    .map((t) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">${escapeHtml(t)}</p>`)
    .join("");
  const cta = block.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(block.cta.url)}" style="background:#0b5d3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block">${escapeHtml(block.cta.label)}</a></p>`
    : "";
  const foot = block.footnote
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b">${escapeHtml(block.footnote)}</p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-weight:700;font-size:16px;color:#0b5d3b">${escapeHtml(siteConfig.name)}</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#0f172a">${escapeHtml(block.heading)}</h1>
${p}${cta}${foot}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8">${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.tagline)} · ${escapeHtml(siteConfig.supportEmail)}</p>
</td></tr></table></body></html>`;
  const text = [
    block.heading,
    "",
    ...block.paragraphs,
    ...(block.cta ? ["", `${block.cta.label}: ${block.cta.url}`] : []),
    ...(block.footnote ? ["", block.footnote] : []),
    "",
    `— ${siteConfig.name}`,
  ].join("\n");
  return { subject, html, text };
}

const NO_GUARANTEE =
  "Resume optimization improves how your experience is presented. It does not guarantee interviews or employment.";

type OrderInfo = { orderNumber: string; targetRole: string; url: string };

export const emails = {
  welcome: (name: string, url: string) =>
    render(`Welcome to ${siteConfig.name}`, {
      heading: `Welcome, ${name}`,
      paragraphs: [
        siteConfig.brandMessage,
        "From your dashboard you can order a professional resume optimization, browse remote jobs, save roles and track your applications.",
      ],
      cta: { label: "Go to my dashboard", url },
    }),

  passwordReset: (url: string) =>
    render("Reset your password", {
      heading: "Reset your password",
      paragraphs: [
        "We received a request to reset your password. This link expires in 1 hour and can only be used once.",
        "If you did not request this, you can ignore this email — your password will not change.",
      ],
      cta: { label: "Choose a new password", url },
    }),

  passwordChanged: () =>
    render("Your password was changed", {
      heading: "Your password was changed",
      paragraphs: [
        "The password for your account was just changed.",
        `If this wasn't you, contact ${siteConfig.supportEmail} immediately.`,
      ],
    }),

  orderReceived: (o: OrderInfo) =>
    render(`Order ${o.orderNumber} created`, {
      heading: "Your resume order has been created",
      paragraphs: [
        `We've saved your order ${o.orderNumber} for the target role "${o.targetRole}".`,
        "Complete payment to start the optimization. You can return to the order page at any time.",
      ],
      cta: { label: "View order", url: o.url },
      footnote: NO_GUARANTEE,
    }),

  paymentConfirmed: (o: OrderInfo & { amountKobo: number; reference: string }) =>
    render(`Payment confirmed — ${o.orderNumber}`, {
      heading: "Payment confirmed",
      paragraphs: [
        `We've received your payment of ${formatNaira(o.amountKobo)} (reference ${o.reference}).`,
        `Our team will review your resume for the role "${o.targetRole}". Typical turnaround is ${siteConfig.resumeOptimization.turnaround}.`,
      ],
      cta: { label: "Track my order", url: o.url },
      footnote: NO_GUARANTEE,
    }),

  orderProcessing: (o: OrderInfo) =>
    render(`Your resume is being optimized — ${o.orderNumber}`, {
      heading: "We're working on your resume",
      paragraphs: [`Order ${o.orderNumber} is now being processed by our team. We'll email you when it's ready.`],
      cta: { label: "Track my order", url: o.url },
    }),

  orderCompleted: (o: OrderInfo) =>
    render(`Your optimized resume is ready — ${o.orderNumber}`, {
      heading: "Your optimized resume is ready",
      paragraphs: [
        `The optimization for order ${o.orderNumber} is complete and going through a final check before delivery.`,
      ],
      cta: { label: "View order", url: o.url },
    }),

  orderDelivered: (o: OrderInfo) =>
    render(`Delivered: your optimized resume — ${o.orderNumber}`, {
      heading: "Your optimized resume has been delivered",
      paragraphs: [
        "Your final resume files (PDF and Word) are available to download from your dashboard.",
        "Downloads use secure, temporary links — sign in to access them at any time.",
        "If you found the service useful, you can share a testimonial from your order page. It's optional.",
      ],
      cta: { label: "Download my resume", url: o.url },
      footnote: NO_GUARANTEE,
    }),

  orderStatus: (o: OrderInfo & { statusLabel: string }) =>
    render(`Order ${o.orderNumber}: ${o.statusLabel}`, {
      heading: `Order update: ${o.statusLabel}`,
      paragraphs: [`Your order ${o.orderNumber} is now "${o.statusLabel}".`],
      cta: { label: "View order", url: o.url },
    }),

  submissionReceived: (companyName: string, jobTitle: string) =>
    render(`We received your job post: ${jobTitle}`, {
      heading: "Thanks — your job is pending review",
      paragraphs: [
        `We've received "${jobTitle}" at ${companyName}. Every listing is reviewed before it is published.`,
        "We may contact you to confirm details such as the company, the application process and whether Nigeria-based applicants are eligible.",
        "Listings that ask applicants for payment are never accepted.",
      ],
    }),

  submissionApproved: (jobTitle: string) =>
    render(`Your job post was approved: ${jobTitle}`, {
      heading: "Your job post was approved",
      paragraphs: [`"${jobTitle}" passed review. Our team will publish it shortly after final formatting checks.`],
    }),

  submissionRejected: (jobTitle: string, reason?: string) =>
    render(`Update on your job post: ${jobTitle}`, {
      heading: "We couldn't publish your job post",
      paragraphs: [
        `Unfortunately "${jobTitle}" did not pass our review.`,
        ...(reason ? [`Reason: ${reason}`] : []),
        `Reply to ${siteConfig.supportEmail} if you'd like to discuss it.`,
      ],
    }),

  jobReportAlert: (jobTitle: string, openReports: number, url: string) =>
    render(`[Admin] ${openReports} open reports: ${jobTitle}`, {
      heading: "A job listing has multiple open reports",
      paragraphs: [`"${jobTitle}" now has ${openReports} open reports. Please review it.`],
      cta: { label: "Review reports", url },
    }),

  paymentMismatchAlert: (reference: string, detail: string) =>
    render(`[Admin] Payment verification failed: ${reference}`, {
      heading: "Payment verification failed",
      paragraphs: [`Reference ${reference} did not pass verification: ${detail}.`, "The order was NOT marked as paid."],
    }),

  savedJobClosing: (jobTitle: string, closingDate: string, url: string) =>
    render(`Closing soon: ${jobTitle}`, {
      heading: "A job you saved closes soon",
      paragraphs: [`"${jobTitle}" closes on ${closingDate}. If you plan to apply, now is a good time.`],
      cta: { label: "View job", url },
    }),

  applicationReminder: (jobTitle: string, url: string) =>
    render(`Follow up on your application: ${jobTitle}`, {
      heading: "Time to follow up?",
      paragraphs: [
        `You applied to "${jobTitle}" two weeks ago. Consider a short, polite follow-up and update your tracker.`,
      ],
      cta: { label: "Update tracker", url },
    }),
};
