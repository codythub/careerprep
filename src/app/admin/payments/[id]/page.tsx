import type { Metadata } from "next";
import { AdminPaymentDetailView } from "@/components/admin/views/payments";

export const metadata: Metadata = { title: "Payment" };

export default async function Page({ params }: PageProps<"/admin/payments/[id]">) {
  const { id } = await params;
  return <AdminPaymentDetailView id={id} />;
}
