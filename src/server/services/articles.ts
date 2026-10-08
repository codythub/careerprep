import type { GuideCategory, Role } from "@prisma/client";
import type { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { articleSchema } from "@/lib/validation";
import { UserError } from "@/server/errors";
import { audit } from "@/server/audit";

type Actor = { id: string; role: Role };
export type ArticleInput = z.infer<typeof articleSchema>;

export async function adminSaveArticle(admin: Actor, input: ArticleInput, id?: string, coverImageUrl?: string) {
  if (admin.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
  const slug = input.slug ?? slugify(input.title);
  const clash = await db.article.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (clash) throw new UserError("Another article already uses this slug. Choose a different one.");

  const existing = id ? await db.article.findUnique({ where: { id } }) : null;
  if (id && !existing) throw new UserError("Article not found.");

  const data = {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content: input.content,
    category: input.category,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    status: input.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    publishedAt: input.publish ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    ...(coverImageUrl ? { coverImageUrl } : {}),
  };
  const article = id
    ? await db.article.update({ where: { id }, data })
    : await db.article.create({ data: { ...data, authorId: admin.id } });
  await audit(admin.id, id ? "article.update" : "article.create", "Article", article.id, { status: data.status });
  return article;
}

export async function adminSetArticleStatus(admin: Actor, id: string, publish: boolean) {
  if (admin.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
  const a = await db.article.findUnique({ where: { id } });
  if (!a) throw new UserError("Article not found.");
  await db.article.update({
    where: { id },
    data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? (a.publishedAt ?? new Date()) : a.publishedAt },
  });
  await audit(admin.id, publish ? "article.publish" : "article.unpublish", "Article", id);
}

export async function adminDeleteArticle(admin: Actor, id: string) {
  if (admin.role !== "ADMIN") throw new UserError("You do not have permission to do that.");
  await db.article.delete({ where: { id } });
  await audit(admin.id, "article.delete", "Article", id);
}

export async function publishedArticles(category?: GuideCategory, take?: number) {
  return db.article.findMany({
    where: { status: "PUBLISHED", ...(category ? { category } : {}) },
    orderBy: { publishedAt: "desc" },
    take,
    select: { id: true, slug: true, title: true, excerpt: true, category: true, coverImageUrl: true, publishedAt: true },
  });
}

export async function publishedArticleBySlug(slug: string) {
  return db.article.findFirst({ where: { slug, status: "PUBLISHED" }, include: { author: { select: { name: true } } } });
}
