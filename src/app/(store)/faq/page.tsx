import type { Metadata } from "next";
import Link from "next/link";
import { jsonLdString } from "@/components/layout/Breadcrumbs";
import { InfoPage } from "@/components/layout/InfoPage";
import { Accordion } from "@/components/ui/Accordion";
import { ALL_FAQS, FAQ_GROUPS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Payments, delivery, returns, sizing, drops and accounts at Kairo, answered.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <InfoPage
      crumbs={[{ label: "FAQ", href: "/faq" }]}
      eyebrow="Help"
      title="Questions, answered"
      intro={
        <>
          Can&apos;t find it here?{" "}
          <Link
            href="/contact"
            className="text-foreground underline underline-offset-4 hover:text-accent"
          >
            Send us a message
          </Link>
          .
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }}
      />
      <div className="flex flex-col gap-14">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title} className="flex flex-col gap-4">
            <h2 className="font-display text-heading03 font-bold">{g.title}</h2>
            <Accordion
              items={g.items.map((f) => ({
                id: f.id,
                title: f.q,
                content: (
                  <p className="max-w-prose pb-6 text-body01 text-foreground-secondary">{f.a}</p>
                ),
              }))}
            />
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
