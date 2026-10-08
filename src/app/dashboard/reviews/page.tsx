import type { Metadata } from "next";
import { ReviewsView } from "@/components/candidate/views/reviews";

export const metadata: Metadata = { title: "Review History" };

export default function ReviewHistoryPage() {
  return <ReviewsView />;
}
