import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { InfoPage } from "@/components/layout/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about sizing, an order or a drop? Send Kairo a message. Replies within one working day.",
  alternates: { canonical: "/contact" },
};

const quick: [string, string, string][] = [
  ["Where's my order?", "/track", "Track it with your order number and email."],
  ["Which size?", "/size-guide", "Measurements for every kind of piece."],
  ["Returns", "/shipping-returns", "7 days, unworn, tags on."],
  ["Everything else", "/faq", "Payments, drops, accounts."],
];

export default function ContactPage() {
  return (
    <InfoPage
      crumbs={[{ label: "Contact", href: "/contact" }]}
      eyebrow={`${SITE.city} · Mon–Sat, 10 AM–7 PM`}
      title="Talk to us"
      intro="Sizing, an order, a drop, or something we got wrong: write and a person replies by email within one working day."
      wide
    >
      <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
        <ContactForm />
        <aside aria-labelledby="quick-title" className="flex flex-col gap-6">
          <h2
            id="quick-title"
            className="font-mono text-caption01 tracking-[0.2em] text-foreground-subtle uppercase"
          >
            Quicker answers
          </h2>
          <ul className="flex flex-col border-t border-border">
            {quick.map(([title, href, text]) => (
              <li key={href} className="border-b border-border">
                <Link href={href} className="group flex items-start justify-between gap-6 py-5">
                  <span className="flex flex-col gap-1">
                    <span className="text-body01 font-semibold transition-colors group-hover:text-accent">
                      {title}
                    </span>
                    <span className="text-body02 text-foreground-secondary">{text}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="pt-1 transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-body02 text-foreground-subtle">
            Kairo is a concept store built as a portfolio project. Messages are read, but no real
            orders are shipped.
          </p>
        </aside>
      </div>
    </InfoPage>
  );
}
