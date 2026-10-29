import Link from "next/link";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { HeroMarker } from "@/components/layout/HeroMarker";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { SilkHero } from "@/components/three/SilkHero";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { COLLECTIONS } from "@/lib/collections";

/** 1 · Fabric hero: KAIRO on graphite silk, the promise, two ways in. */
export function Hero({
  dropSlug,
  dropLabel,
}: {
  dropSlug: string | null;
  dropLabel: string | null;
}) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-(--header-h) flex min-h-svh flex-col justify-end overflow-hidden px-gutter pt-32 pb-14 md:pb-20"
    >
      <HeroMarker />
      <SilkHero />
      <div className="mx-auto grid w-full max-w-site gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex flex-col gap-6">
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              Ahmedabad · Menswear · Est. 2026
            </p>
          </Reveal>
          <SplitText
            as="h1"
            immediate
            delay={0.15}
            text={"Four lives.\nOne label."}
            className="font-display text-hero01 font-bold"
          />
          <Reveal delay={0.5}>
            <p className="max-w-[34rem] text-body01 text-foreground-secondary">
              Streetwear for the late nights, tailoring for the big days, quiet heritage for the
              weekends and armour for the road. Cut and finished in Ahmedabad.
            </p>
          </Reveal>
          <Reveal delay={0.65} className="flex flex-wrap gap-3">
            <MagneticButton>
              <Link href="/shop" className={buttonClasses("primary", "lg")}>
                Shop the four
              </Link>
            </MagneticButton>
            {dropSlug && dropLabel && (
              <MagneticButton>
                <Link href={`/drops/${dropSlug}`} className={buttonClasses("outline", "lg")}>
                  {dropLabel}
                </Link>
              </MagneticButton>
            )}
          </Reveal>
        </div>

        <Reveal delay={0.8} as="div" className="hidden md:block">
          <nav aria-label="Collections">
            <ul className="flex flex-col gap-1 border-l border-border-strong pl-6">
              {COLLECTIONS.map((c) => (
                <li key={c.slug}>
                  <CollectionLink
                    href={c.href}
                    className="group flex items-center gap-3 py-1.5 font-mono text-caption01 tracking-[0.14em] text-foreground-secondary uppercase transition-colors hover:text-foreground"
                  >
                    <span className="text-accent">{c.number}</span>
                    {c.name}
                    <ArrowRightIcon
                      size={14}
                      className="-translate-x-1 opacity-0 transition-[opacity,transform] duration-200 ease-ui group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </CollectionLink>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
      </div>
    </section>
  );
}
