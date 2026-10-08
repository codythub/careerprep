/**
 * Rotating accent colours for cards and icons. Brand green leads; the others add
 * variety. Full class strings are listed so Tailwind can detect them.
 */
export const ACCENTS = [
  { top: "border-t-emerald-500", icon: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" },
  { top: "border-t-sky-500", icon: "bg-sky-100 text-sky-700", text: "text-sky-700" },
  { top: "border-t-amber-500", icon: "bg-amber-100 text-amber-700", text: "text-amber-700" },
  { top: "border-t-violet-500", icon: "bg-violet-100 text-violet-700", text: "text-violet-700" },
  { top: "border-t-rose-500", icon: "bg-rose-100 text-rose-700", text: "text-rose-700" },
  { top: "border-t-teal-500", icon: "bg-teal-100 text-teal-700", text: "text-teal-700" },
] as const;

export function accent(index: number) {
  return ACCENTS[index % ACCENTS.length]!;
}
