import Link from "next/link";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { HeroMarker } from "@/components/layout/HeroMarker";
import { buttonClasses } from "@/components/ui/Button";
import { COLLECTIONS } from "@/lib/collections";

/**
 * TEMPORARY home page — the real one (silk hero, Four Wardrobes journey…)
 * arrives in Task 6. This one shows the header sitting transparent over a hero.
 */
export default function HomeCheck() {
  return (
    <>
      <section className="relative -mt-(--header-h) flex min-h-svh flex-col justify-end overflow-hidden px-gutter pb-16 pt-32">
        <HeroMarker />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(80% 60% at 70% 30%, color-mix(in oklab, var(--color-accent) 22%, transparent) 0%, transparent 70%), linear-gradient(180deg, var(--color-background-tertiary) 0%, var(--color-background) 100%)",
          }}
        />
        <div className="mx-auto flex w-full max-w-site flex-col gap-6">
          <p className="font-mono text-caption01 uppercase text-accent">Work in progress · Task 4</p>
          <h1 className="font-display text-hero01 font-bold">
            Four lives.
            <br />
            One label.
          </h1>
          <p className="max-w-prose text-body01 text-foreground-secondary">
            The header floats over this hero and turns solid as you scroll. Scroll down and it slides away;
            scroll up and it comes back. The silk hero replaces this in Task 6.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/styleguide" className={buttonClasses("primary", "lg")}>
              Try the bag
            </Link>
            <CollectionLink href="/collections/old-money" className={buttonClasses("outline", "lg")}>
              Old Money
            </CollectionLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="wardrobes" className="mx-auto flex max-w-site flex-col gap-8 px-gutter py-section">
        <h2 id="wardrobes" className="font-mono text-caption01 uppercase text-foreground-subtle">
          The four wardrobes
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <CollectionLink
                href={c.href}
                className="flex min-h-56 flex-col justify-between border border-border-strong p-5 transition-colors duration-200 hover:border-accent"
              >
                <span className="font-mono text-caption02 uppercase text-accent">
                  {c.number} · {c.mood}
                </span>
                <span className="flex flex-col gap-2">
                  <span className="font-display text-heading03 font-bold">{c.name}</span>
                  <span className="text-body02 text-foreground-secondary">{c.tagline}</span>
                </span>
              </CollectionLink>
            </li>
          ))}
        </ul>
      </section>
      <div className="h-[60svh]" aria-hidden="true" />
    </>
  );
}
