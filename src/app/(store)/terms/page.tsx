import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of using Kairo, a concept menswear store with test-mode payments.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage
      crumbs={[{ label: "Terms", href: "/terms" }]}
      eyebrow="Legal · Updated 31 October 2026"
      title="Terms"
      intro="Short, because this is a concept store. By using the site you agree to the points below."
    >
      <InfoSection id="concept" title="A concept store">
        <p>
          Kairo is a portfolio project by {SITE.creditName}. It is not a registered business, it
          does not sell real goods and no order is ever shipped. Payments run in Razorpay&apos;s
          test mode: use test cards only, never your own.
        </p>
      </InfoSection>
      <InfoSection id="orders" title="Orders and prices">
        <p>
          Prices are in Indian rupees and are checked again on our side at checkout. If a piece
          sells out or a price changes while it&apos;s in your bag, checkout tells you before you
          pay. The delivery and returns rules shown on{" "}
          <Link href="/shipping-returns">Shipping and returns</Link> are part of the shop&apos;s
          design.
        </p>
      </InfoSection>
      <InfoSection id="content" title="What you post">
        <p>
          Reviews and photos you submit are checked before they appear and can be removed at any
          time. Don&apos;t post anything you don&apos;t have the right to share, or anything about
          other people.
        </p>
      </InfoSection>
      <InfoSection id="use" title="Fair use">
        <p>
          Please don&apos;t try to break, overload or scrape the site. Forms are rate-limited and
          checked for bots. Design, code and visuals are © 2026 {SITE.creditName}.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
