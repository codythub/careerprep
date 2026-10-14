import type { Metadata } from "next";
import { AdminResumeDetailView } from "@/components/admin/views/resumes";

export const metadata: Metadata = { title: "Resume" };

export default async function Page({ params }: PageProps<"/admin/resumes/[id]">) {
  const { id } = await params;
  return <AdminResumeDetailView id={id} />;
}
