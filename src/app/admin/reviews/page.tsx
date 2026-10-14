import type { Metadata } from "next";
import { AdminReviewsView } from "@/components/admin/views/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return <AdminReviewsView />;
}
