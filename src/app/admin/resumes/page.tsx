import type { Metadata } from "next";
import { AdminResumesView } from "@/components/admin/views/resumes";

export const metadata: Metadata = { title: "Resumes" };

export default function Page() {
  return <AdminResumesView />;
}
