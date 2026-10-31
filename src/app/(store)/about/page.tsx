import type { Metadata } from "next";
import Link from "next/link";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { InfoSection } from "@/components/layout/InfoPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { COLLECTIONS } from "@/lib/collections";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kairo is an Ahmedabad menswear label for four lives: Streetwear, Formal, Old Money and Riding. A concept store designed and built by Jainam Gondaliya.",
  alternates: { canonical: "/about" },
};

const BUILT_WITH = [
  "Next.js and React, TypeScript",
  "Supabase: database, accounts, private photo storage",
  "Razorpay checkout (test mode), signed and checked on the server",
  "Tailwind CSS, Motion and GSAP, Three.js for the silk",
  "Rate limits, bot checks and row-level security on every table",
];

export default function AboutPage() {
  return (
    <div className="px-gutter pt-10 pb-section">
      <div className="mx-auto flex max-w-site flex-col gap-section">
        <header className="flex flex-col gap-8">
          <Breadcrumbs items={[{ label: "About", href: "/about" }]} />
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {SITE.city} · Est. 2026
            </p>
          </Reveal>
          <SplitText
            as="h1"
            immediate
            text={"Four lives.\nOne label."}
            className="font-display text-hero01 font-bold"
          />
          <Reveal delay={0.25}>
            <p className="max-w-2xl text-heading03 text-foreground-secondary">
              The same man rides out at dawn, closes a deal by noon, spends Sunday at the club and
              is still out at 2 AM. Kairo dresses all four.
            </p>
          </Reveal>
        </header>

        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <Reveal>
            <p className="font-display text-heading01 font-bold">
              Kairos: the right moment, not just any moment.
            </p>
          </Reveal>
          <div className="flex flex-col">
            <InfoSection title="Why four wardrobes">
              <p>
                Most labels pick one kind of man. Real wardrobes don&apos;t work that way. Kairo is
                cut around four moments in a week, each with its own colours, fabrics and rules,
                made to sit in the same cupboard.
              </p>
            </InfoSection>
            <InfoSection title="Made with intent">
              <p>
                Heavy cottons that hold their shape, wool that drapes, linen that softens, riding
                gear with real armour pockets. Fewer pieces, made to be worn hard. Drops are small
                and never restocked.
              </p>
            </InfoSection>
          </div>
        </div>

        <nav aria-label="The four wardrobes">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <CollectionLink
                  href={c.href}
                  className="group flex min-h-48 flex-col justify-between border border-border-strong p-6 transition-colors hover:border-accent"
                >
                  <span className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
                    {c.number} · {c.mood}
                  </span>
                  <span className="flex flex-col gap-2">
                    <span className="font-display text-heading02 font-bold transition-colors group-hover:text-accent">
                      {c.name}
                    </span>
                    <span className="text-body02 text-foreground-secondary">{c.tagline}</span>
                  </span>
                </CollectionLink>
              </li>
            ))}
          </ul>
        </nav>

        <section
          aria-labelledby="concept-title"
          className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24"
        >
          <div className="flex flex-col gap-4">
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              A concept store
            </p>
            <h2 id="concept-title" className="font-display text-heading01 font-bold">
              Designed and built by {SITE.creditName}
            </h2>
          </div>
          <div className="flex flex-col gap-6 text-body01 text-foreground-secondary">
            <p>
              Kairo isn&apos;t a company. It&apos;s a complete, working shop made as a portfolio
              project: accounts, a real checkout in Razorpay&apos;s test mode, order tracking,
              reviews and drops. No real money moves and nothing ships.
            </p>
            <p>
              Product visuals are concept images made for this project. Reviews marked Sample were
              written to demonstrate the reviews section.
            </p>
            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-caption01 tracking-[0.14em] text-foreground uppercase">
                Built with
              </h3>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {BUILT_WITH.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              <a
                href={SITE.creditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-accent"
              >
                See more of {SITE.creditName}&apos;s work ↗
              </a>
              <Link
                href="/contact"
                className="text-foreground underline underline-offset-4 hover:text-accent"
              >
                Get in touch
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
