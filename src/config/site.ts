/**
 * Central brand + business configuration.
 * Rebranding the platform should only require editing this file (and env vars).
 * Safe to import from both server and client code — contains no secrets.
 */
export const siteConfig = {
  name: "CareerPrep NG",
  shortName: "CareerPrep",
  legalName: "CareerPrep NG",
  tagline: "Prepare Better. Apply Smarter.",
  description:
    "Automated resume reviews and practical career guidance designed for ambitious Nigerian professionals.",
  brandMessage: "Your skills deserve a better presentation.",
  supportingMessage:
    "We help you build a stronger professional profile, discover relevant opportunities and prepare for the application process.",
  /** Placeholder until the final domain is registered. NEXT_PUBLIC_SITE_URL overrides it. */
  domain: "careerprep.example.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "support@careerprep.example.com",
  locale: "en_NG",
  country: "Nigeria",
  currency: "NGN",
  currencySymbol: "₦",
  social: {
    linkedin: "",
    x: "",
    instagram: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
