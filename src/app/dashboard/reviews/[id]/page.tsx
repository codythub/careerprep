import type { Metadata } from "next";
import { ReviewDetailView } from "@/components/candidate/views/review-detail";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: PageProps<"/dashboard/reviews/[id]">) {
  const { id } = await params;
  return <ReviewDetailView id={id} />;
}
