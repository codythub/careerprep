import type { Metadata } from "next";
import { AdminPaymentsView } from "@/components/admin/views/payments";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <AdminPaymentsView />;
}
