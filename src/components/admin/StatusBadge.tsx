import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/cn";

const PAYMENT_LABEL = {
  pending: "Unpaid",
  paid: "Paid",
  failed: "Payment failed",
  refund_due: "Refund due",
  refunded: "Refunded",
} as const;

const tone: Record<OrderStatus, string> = {
  pending_payment: "border-border-strong text-foreground-subtle",
  placed: "border-accent text-accent",
  packed: "border-accent text-accent",
  shipped: "border-foreground-secondary text-foreground-secondary",
  delivered: "border-border-strong text-foreground-secondary",
  cancelled: "border-error/60 text-error",
};

/** Order status, plus the payment state when it needs attention. */
export function StatusBadge({
  status,
  payment,
}: {
  status: OrderStatus;
  payment?: keyof typeof PAYMENT_LABEL;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span className={cn("border px-2 py-0.5 font-mono text-caption02 uppercase", tone[status])}>
        {ORDER_STATUS_LABEL[status]}
      </span>
      {payment &&
        payment !== "paid" &&
        !(status === "pending_payment" && payment === "pending") && (
          <span
            className={cn(
              "border px-2 py-0.5 font-mono text-caption02 uppercase",
              payment === "refund_due"
                ? "border-error bg-error/10 text-error"
                : "border-border-strong text-foreground-subtle",
            )}
          >
            {PAYMENT_LABEL[payment]}
          </span>
        )}
    </span>
  );
}

export const adminDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
