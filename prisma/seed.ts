/**
 * Development seed.
 *  - 15 job categories
 *  - admin user (credentials from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD — never hardcoded)
 *  - default platform settings
 *  - clearly marked DEMO jobs (skipped in production unless SEED_DEMO_JOBS=true)
 *  - starter career guides (genuine advice, no claims or statistics)
 *
 * Deliberately seeds NO testimonials and NO success stories.
 */
import { PrismaClient, type ExperienceLevel, type EmploymentType, type NigeriaEligibility, type WorkMode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GUIDES } from "./seed-guides";

const db = new PrismaClient();
const isProduction = process.env.NODE_ENV === "production";

const CATEGORIES = [
  "Technology",
  "Marketing",
  "Sales",
  "Customer Support",
  "Finance",
  "Operations",
  "Human Resources",
  "Design",
  "Writing",
  "Data",
  "Virtual Assistant",
  "Product",
  "Engineering",
  "Entry Level",
  "Internship",
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type DemoJob = {
  title: string;
  category: string;
  workMode: WorkMode;
  nigeriaEligibility: NigeriaEligibility;
  eligibilityNote?: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  locationEligibility: string;
  salary?: [number, number, string, "MONTHLY" | "YEARLY" | "HOURLY"];
  featured?: boolean;
  closesInDays?: number;
};

const DEMO_JOBS: DemoJob[] = [
  { title: "Customer Support Specialist", category: "Customer Support", workMode: "REMOTE", nigeriaEligibility: "VERIFIED", eligibilityNote: "DEMO: sample of a verified listing", employmentType: "FULL_TIME", experienceLevel: "ENTRY", locationEligibility: "Worldwide", salary: [700, 1000, "USD", "MONTHLY"], featured: true, closesInDays: 30 },
  { title: "Frontend Developer (React)", category: "Engineering", workMode: "REMOTE", nigeriaEligibility: "UNVERIFIED", employmentType: "FULL_TIME", experienceLevel: "MID", locationEligibility: "EMEA time zones", salary: [30000, 45000, "USD", "YEARLY"], featured: true, closesInDays: 21 },
  { title: "Content Writer", category: "Writing", workMode: "REMOTE", nigeriaEligibility: "VERIFIED", eligibilityNote: "DEMO: sample of a verified listing", employmentType: "CONTRACT", experienceLevel: "MID", locationEligibility: "Africa", salary: [15, 25, "USD", "HOURLY"], closesInDays: 14 },
  { title: "Virtual Assistant", category: "Virtual Assistant", workMode: "REMOTE", nigeriaEligibility: "UNVERIFIED", employmentType: "PART_TIME", experienceLevel: "ENTRY", locationEligibility: "Worldwide" },
  { title: "Data Analyst", category: "Data", workMode: "HYBRID", nigeriaEligibility: "VERIFIED", eligibilityNote: "DEMO: Lagos-based role", employmentType: "FULL_TIME", experienceLevel: "MID", locationEligibility: "Lagos, Nigeria", salary: [450000, 650000, "NGN", "MONTHLY"], featured: true, closesInDays: 28 },
  { title: "Product Designer", category: "Design", workMode: "REMOTE", nigeriaEligibility: "NOT_ELIGIBLE", employmentType: "FULL_TIME", experienceLevel: "SENIOR", locationEligibility: "United States only" },
  { title: "Marketing Intern", category: "Internship", workMode: "ONSITE", nigeriaEligibility: "VERIFIED", eligibilityNote: "DEMO: Abuja-based role", employmentType: "INTERNSHIP", experienceLevel: "ENTRY", locationEligibility: "Abuja, Nigeria", salary: [100000, 100000, "NGN", "MONTHLY"], closesInDays: 10 },
  { title: "Sales Development Representative", category: "Sales", workMode: "REMOTE", nigeriaEligibility: "UNVERIFIED", employmentType: "FULL_TIME", experienceLevel: "ENTRY", locationEligibility: "Worldwide", closesInDays: 45 },
];

async function main() {
  // Categories
  for (const [i, name] of CATEGORIES.entries()) {
    await db.jobCategory.upsert({
      where: { slug: slug(name) },
      create: { name, slug: slug(name), sortOrder: i },
      update: { name, sortOrder: i },
    });
  }
  console.log(`✓ ${CATEGORIES.length} job categories`);

  // Settings
  await db.setting.upsert({ where: { key: "resume_price_kobo" }, create: { key: "resume_price_kobo", value: 600000 }, update: {} });
  console.log("✓ default settings (resume price ₦6,000)");

  // Admin
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  let adminId: string | null = null;
  if (!email || !password) {
    console.warn("! SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user");
  } else {
    if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
    const admin = await db.user.upsert({
      where: { email },
      create: { email, name: process.env.SEED_ADMIN_NAME ?? "Platform Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
      update: { role: "ADMIN" },
    });
    adminId = admin.id;
    console.log(`✓ admin user ${email}`);
  }

  // Demo jobs
  const seedDemo = !isProduction || process.env.SEED_DEMO_JOBS === "true";
  if (seedDemo) {
    const categories = new Map((await db.jobCategory.findMany()).map((c) => [c.name, c.id]));
    for (const [i, j] of DEMO_JOBS.entries()) {
      const jobSlug = `demo-${slug(j.title)}`;
      const now = Date.now();
      await db.job.upsert({
        where: { slug: jobSlug },
        update: {},
        create: {
          slug: jobSlug,
          title: j.title,
          companyName: "Demo Company (sample listing)",
          companyWebsite: "https://example.com",
          description: `**This is a demo listing for development and testing. It is not a real job opportunity.**\n\nThis sample ${j.title} role shows how listings appear on the job board, including eligibility labels, salary display and application instructions.`,
          responsibilities: "- Sample responsibility one\n- Sample responsibility two\n- Sample responsibility three",
          requirements: "- Sample requirement one\n- Sample requirement two",
          applicationInstructions: "Demo listing — the application link points to example.com and does not accept applications.",
          categoryId: categories.get(j.category)!,
          workMode: j.workMode,
          locationEligibility: j.locationEligibility,
          nigeriaEligibility: j.nigeriaEligibility,
          eligibilityNote: j.eligibilityNote,
          employmentType: j.employmentType,
          experienceLevel: j.experienceLevel,
          salaryMin: j.salary?.[0],
          salaryMax: j.salary?.[1],
          salaryCurrency: j.salary?.[2],
          salaryPeriod: j.salary?.[3],
          applyUrl: "https://example.com/demo-application",
          postedAt: new Date(now - i * 86_400_000),
          closingDate: j.closesInDays ? new Date(now + j.closesInDays * 86_400_000) : null,
          status: "PUBLISHED",
          isFeatured: !!j.featured,
          isDemo: true,
          source: "ADMIN",
          ...(j.nigeriaEligibility === "VERIFIED" && adminId ? { verifiedAt: new Date(), verifiedById: adminId } : {}),
        },
      });
    }
    console.log(`✓ ${DEMO_JOBS.length} DEMO jobs (clearly labelled, isDemo=true)`);
  }

  // Starter guides
  if (adminId) {
    for (const g of GUIDES) {
      await db.article.upsert({
        where: { slug: g.slug },
        update: {},
        create: { ...g, status: "PUBLISHED", publishedAt: new Date(), authorId: adminId },
      });
    }
    console.log(`✓ ${GUIDES.length} career guides`);
  }

  console.log("Seed complete. No testimonials or success stories were created (by design).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
