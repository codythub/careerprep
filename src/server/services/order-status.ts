import type { OrderStatus } from "@prisma/client";

/**
 * Allowed admin-driven order transitions. PAID is intentionally absent from every
 * list: only verified payment processing (payments.ts) may move an order to PAID.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["RECEIVED", "REFUNDED"],
  RECEIVED: ["IN_REVIEW", "REFUNDED"],
  IN_REVIEW: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["COMPLETED", "IN_REVIEW", "REFUNDED"],
  COMPLETED: ["DELIVERED", "PROCESSING", "REFUNDED"],
  DELIVERED: ["PROCESSING", "REFUNDED"], // PROCESSING = revision round
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Statuses where the customer has paid and work is (or was) underway. */
export const PAID_STATUSES: OrderStatus[] = ["PAID", "RECEIVED", "IN_REVIEW", "PROCESSING", "COMPLETED", "DELIVERED"];

/** Ordered customer-facing progress steps. */
export const ORDER_PROGRESS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "RECEIVED",
  "IN_REVIEW",
  "PROCESSING",
  "COMPLETED",
  "DELIVERED",
];
