import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight text-slate-950" aria-label={`${siteConfig.name} home`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white" aria-hidden>
        {siteConfig.shortName.slice(0, 1)}
      </span>
      <span className="text-base">{siteConfig.name}</span>
    </Link>
  );
}
