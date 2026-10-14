import type { Metadata } from "next";
import { AdminReviewDetailView } from "@/components/admin/views/reviews";

export const metadata: Metadata = { title: "Review" };

export default async function Page({ params }: PageProps<"/admin/reviews/[id]">) {
  const { id } = await params;
  return <AdminReviewDetailView id={id} />;
}
