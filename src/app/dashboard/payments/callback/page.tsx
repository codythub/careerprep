import type { Metadata } from "next";
import { PaymentCallbackView } from "@/components/candidate/views/payment-callback";

export const metadata: Metadata = { title: "Payment" };

export default function PaymentCallbackPage() {
  return <PaymentCallbackView />;
}
