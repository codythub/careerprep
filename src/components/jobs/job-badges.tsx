import { BadgeCheck, CircleAlert, Globe2, MapPin, Ban } from "lucide-react";
import type { NigeriaEligibility, WorkMode } from "@prisma/client";
import { Badge } from "@/components/ui/primitives";
import { ELIGIBILITY_LABEL, WORK_MODE_LABEL } from "@/lib/labels";

/** Remote/hybrid/on-site. Deliberately separate from Nigeria eligibility. */
export function WorkModeBadge({ mode }: { mode: WorkMode }) {
  return (
    <Badge tone={mode === "REMOTE" ? "info" : "neutral"}>
      {mode === "REMOTE" ? <Globe2 className="size-3" aria-hidden /> : <MapPin className="size-3" aria-hidden />}
      {WORK_MODE_LABEL[mode]}
    </Badge>
  );
}

/**
 * "Nigeria Eligible" only renders for admin-VERIFIED jobs. Everything else tells the
 * candidate to check eligibility — we never imply eligibility we haven't confirmed.
 */
export function EligibilityBadge({ eligibility }: { eligibility: NigeriaEligibility }) {
  if (eligibility === "VERIFIED") {
    return (
      <Badge tone="success">
        <BadgeCheck className="size-3" aria-hidden />
        {ELIGIBILITY_LABEL.VERIFIED}
      </Badge>
    );
  }
  if (eligibility === "NOT_ELIGIBLE") {
    return (
      <Badge tone="danger">
        <Ban className="size-3" aria-hidden />
        Not open to Nigeria
      </Badge>
    );
  }
  return (
    <Badge tone="warning">
      <CircleAlert className="size-3" aria-hidden />
      {ELIGIBILITY_LABEL.UNVERIFIED}
    </Badge>
  );
}

export function ListingFlags({ isFeatured, isSponsored, isDemo }: { isFeatured: boolean; isSponsored: boolean; isDemo: boolean }) {
  return (
    <>
      {isDemo && <Badge tone="danger">Demo listing — not a real job</Badge>}
      {isSponsored && <Badge tone="accent">Sponsored</Badge>}
      {isFeatured && <Badge tone="brand">Featured</Badge>}
    </>
  );
}
