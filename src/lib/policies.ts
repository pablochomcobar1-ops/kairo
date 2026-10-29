import { formatINR } from "./money";
import { FREE_SHIPPING_THRESHOLD_PAISE, SHIPPING_FEE_PAISE } from "./pricing";

/** Store promises, written once and shown on product pages, the bag and /shipping-returns. */
export const POLICY = {
  delivery: `Delivered across India in 3–6 working days. Free over ${formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}, otherwise ${formatINR(SHIPPING_FEE_PAISE)}.`,
  returns:
    "Return or exchange within 7 days of delivery, unworn and with tags on. Drop pieces can be exchanged, not returned.",
  short: `Free delivery over ${formatINR(FREE_SHIPPING_THRESHOLD_PAISE)} · 7-day returns`,
} as const;
