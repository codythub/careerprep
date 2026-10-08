"use client";

import { useSearchParams } from "next/navigation";

/** Current `?page=` (1-based) for Laravel's paginated lists. */
export function usePageParam(): number {
  const n = Number(useSearchParams().get("page"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}
