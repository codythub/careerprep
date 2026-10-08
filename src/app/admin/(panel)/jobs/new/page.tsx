import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { JobForm } from "@/components/admin/admin-forms";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "New job" };

export default async function NewJobPage() {
  await requireAdmin();
  const categories = await db.jobCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/jobs" className="text-sm text-slate-500 hover:text-slate-900">← Jobs</Link>
      <PageHeader title="New job" description="Jobs are created as drafts. Publish after checking the employer and eligibility." />
      <Card>
        <CardBody>
          <JobForm job={{ nigeriaEligibility: "UNVERIFIED" }} categories={categories} />
        </CardBody>
      </Card>
    </>
  );
}
