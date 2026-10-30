import type { Database } from "@/types/db";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The steps shown on the tracking line, in order. */
export const ORDER_STEPS: OrderStatus[] = ["placed", "packed", "shipped", "delivered"];

/** How far along the line an order is (−1 before payment or when cancelled). */
export const stepIndex = (status: OrderStatus) => ORDER_STEPS.indexOf(status);
