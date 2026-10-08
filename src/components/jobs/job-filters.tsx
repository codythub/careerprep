import Link from "next/link";
import type { JobFilters } from "@/lib/validation";
import { EMPLOYMENT_TYPE_LABEL, EXPERIENCE_LEVEL_LABEL, options } from "@/lib/labels";
import { buttonClass } from "@/components/ui/button";

const selectCls =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/**
 * Plain GET form: filters live in the URL (shareable, crawlable, works without JS).
 */
export function JobFiltersForm({
  filters,
  categories,
  action = "/jobs",
}: {
  filters: JobFilters;
  categories: Array<{ slug: string; name: string }>;
  action?: string;
}) {
  return (
    <form action={action} method="get" className="space-y-5" role="search" aria-label="Filter jobs">
      <div className="space-y-1.5">
        <label htmlFor="q" className="text-sm font-medium">
          Search
        </label>
        <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Title, company or keyword" className={selectCls} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Location</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="remote" value="1" defaultChecked={!!filters.remote} className="mt-0.5 size-4 accent-brand-700" />
          <span>Remote only</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="ng" value="1" defaultChecked={!!filters.ng} className="mt-0.5 size-4 accent-brand-700" />
          <span>
            Nigeria Eligible only
            <span className="block text-xs text-slate-500">Jobs our team has confirmed accept Nigeria-based applicants</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="salary" value="1" defaultChecked={!!filters.salary} className="mt-0.5 size-4 accent-brand-700" />
          <span>Salary listed</span>
        </label>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <select id="category" name="category" defaultValue={filters.category ?? ""} className={selectCls}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium">
          Employment type
        </label>
        <select id="type" name="type" defaultValue={filters.type ?? ""} className={selectCls}>
          <option value="">Any type</option>
          {options(EMPLOYMENT_TYPE_LABEL).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="level" className="text-sm font-medium">
          Experience level
        </label>
        <select id="level" name="level" defaultValue={filters.level ?? ""} className={selectCls}>
          <option value="">Any level</option>
          {options(EXPERIENCE_LEVEL_LABEL).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sort" className="text-sm font-medium">
          Sort by
        </label>
        <select id="sort" name="sort" defaultValue={filters.sort ?? "newest"} className={selectCls}>
          <option value="newest">Newest</option>
          <option value="closing">Closing soon</option>
          <option value="salary">Highest salary</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="submit" className={buttonClass("primary", "md", "flex-1")}>
          Apply filters
        </button>
        <Link href={action} className={buttonClass("ghost", "md")}>
          Reset
        </Link>
      </div>
    </form>
  );
}
