import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/format";

/** Brand mark: same "C" glyph as the favicon (src/app/icon.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--color-brand-600)" />
      <path d="M20.5 11.2A6.5 6.5 0 1 0 20.5 20.8" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 rounded-lg font-semibold tracking-tight text-slate-950", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark />
      <span className="text-base">{siteConfig.name}</span>
    </Link>
  );
}
