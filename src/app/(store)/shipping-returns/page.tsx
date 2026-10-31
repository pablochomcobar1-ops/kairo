import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE, SHIPPING_FEE_PAISE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Shipping and returns",
  description: `Delivery across India in 3–6 working days, free over ${formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}. Returns and exchanges within 7 days.`,
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      crumbs={[{ label: "Shipping and returns", href: "/shipping-returns" }]}
      eyebrow="Help · Delivery"
      title="Shipping and returns"
      intro="Kairo is a concept store, so no real parcels leave the studio. These are the rules the shop is built around, and checkout follows them exactly."
    >
      <InfoSection id="delivery" title="Delivery">
        <ul>
          <li>Across India, in 3 to 6 working days from the order.</li>
          <li>
            <strong>Free</strong> when your order is over {formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}{" "}
            after any discount. Otherwise {formatINR(SHIPPING_FEE_PAISE)}.
          </li>
          <li>
            You get an email when the order is placed, and you can follow it any time on{" "}
            <Link href="/track">Track an order</Link>.
          </li>
        </ul>
      </InfoSection>
      <InfoSection id="returns" title="Returns">
        <ul>
          <li>Within 7 days of delivery, unworn, unwashed and with the tags on.</li>
          <li>
            Refunds go back to how you paid, within 5 to 7 working days of the return arriving.
          </li>
          <li>
            Start a return from <Link href="/contact">Contact</Link> with your order number.
          </li>
        </ul>
      </InfoSection>
      <InfoSection id="exchanges" title="Exchanges">
        <p>
          Wrong size? Exchange it within the same 7 days, free. <strong>Drop pieces</strong> can be
          exchanged for another size while stock lasts but can&apos;t be returned, because they are
          never restocked.
        </p>
      </InfoSection>
      <InfoSection id="riding" title="Riding gear">
        <p>
          Protective pieces (armour, gloves) must come back with any armour inserts and in their
          original packaging. Gear that shows signs of a fall can&apos;t be returned, for the next
          rider&apos;s safety.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
