import type { Metadata } from "next";
import { ResumesView } from "@/components/candidate/views/resumes";

export const metadata: Metadata = { title: "My Resumes" };

export default function ResumesPage() {
  return <ResumesView />;
}
