import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";

export const SETTING_KEYS = {
  resumePriceKobo: "resume_price_kobo",
} as const;

/** Authoritative, server-side resume price. Never taken from the browser. */
export async function getResumePriceKobo(): Promise<number> {
  const row = await db.setting.findUnique({ where: { key: SETTING_KEYS.resumePriceKobo } });
  const value = typeof row?.value === "number" ? row.value : Number(row?.value);
  return Number.isInteger(value) && value > 0 ? value : siteConfig.resumeOptimization.defaultPriceKobo;
}

export async function setSetting(key: string, value: string | number) {
  await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}
