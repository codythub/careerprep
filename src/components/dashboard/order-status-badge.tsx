import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/primitives";
import { ORDER_STATUS_LABEL } from "@/lib/labels";

const TONE: Record<OrderStatus, "neutral" | "brand" | "success" | "warning" | "danger" | "info"> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  RECEIVED: "info",
  IN_REVIEW: "info",
  PROCESSING: "brand",
  COMPLETED: "brand",
  DELIVERED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
