import type { Metadata } from "next";
import { ResumeDetailView } from "@/components/candidate/views/resume-detail";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumeDetailPage({ params }: PageProps<"/dashboard/resumes/[id]">) {
  const { id } = await params;
  return <ResumeDetailView id={id} />;
}
