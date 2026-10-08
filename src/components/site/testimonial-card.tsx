import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { initials } from "@/lib/format";

export function TestimonialCard({
  t,
}: {
  t: { name: string; jobTitle: string | null; company: string | null; imageUrl: string | null; content: string; isVerified: boolean };
}) {
  return (
    <figure className="flex h-full flex-col card p-6">
      <blockquote className="flex-1 text-[15px] leading-relaxed text-slate-700">“{t.content}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        {t.imageUrl ? (
          <Image src={t.imageUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800" aria-hidden>
            {initials(t.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
          {(t.jobTitle || t.company) && (
            <p className="truncate text-xs text-slate-500">{[t.jobTitle, t.company].filter(Boolean).join(", ")}</p>
          )}
        </div>
        {t.isVerified && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700" title="Linked to a genuine platform order">
            <BadgeCheck className="size-4" aria-hidden />
            Verified customer
          </span>
        )}
      </figcaption>
    </figure>
  );
}
