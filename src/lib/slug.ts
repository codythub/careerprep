import { randomBytes } from "node:crypto";

export function slugify(input: string, maxLength = 80): string {
  return (
    input
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLength)
      .replace(/-+$/g, "") || "item"
  );
}

/** Find a free slug by appending a short random suffix when `taken` returns true. */
export async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base);
  if (!(await taken(root))) return root;
  for (let i = 0; i < 5; i++) {
    const candidate = `${root}-${randomBytes(3).toString("hex")}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
