import Link from "next/link";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { HeroMarker } from "@/components/layout/HeroMarker";
import { SilkHero } from "@/components/three/SilkHero";
import { WardrobeJourney } from "@/components/three/journey/WardrobeJourney";
import { buttonClasses } from "@/components/ui/Button";

/**
 * TEMPORARY home page — the real one (silk hero, Four Wardrobes journey…)
 * arrives in Task 6. This one shows the header sitting transparent over a hero.
 */
export default function HomeCheck() {
  return (
    <>
      <section className="relative isolate -mt-(--header-h) flex min-h-svh flex-col justify-end overflow-hidden px-gutter pb-16 pt-32">
        <HeroMarker />
        <SilkHero />
        <div className="mx-auto flex w-full max-w-site flex-col gap-6">
          <p className="font-mono text-caption01 uppercase text-accent">Work in progress · Task 5</p>
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

      <WardrobeJourney />
    </>
  );
}
