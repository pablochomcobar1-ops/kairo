import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/** Always Noir, always calm. Guests and signed-in shoppers both check out here. */
export default function CheckoutPage() {
  return (
    <div className="px-gutter pt-10 pb-section md:pt-14">
      <div className="mx-auto flex max-w-site flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
            Secure checkout
          </p>
          <h1 className="font-display text-heading01 font-bold">Checkout</h1>
        </header>
        <CheckoutClient />
      </div>
    </div>
  );
}
