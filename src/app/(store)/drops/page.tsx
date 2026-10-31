import type { Metadata } from "next";
import Link from "next/link";
import { DropStatus } from "@/components/drops/DropStatus";
import { DropAlertsSection } from "@/components/home/DropAlertsSection";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Visual } from "@/components/product/ProductCard";
import { dropDateIST } from "@/lib/countdown";
import { splitDropName } from "@/lib/drops";
import { getDrops } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Kairo drops: small runs released on a set date, never restocked. See what's next and get an email when it opens.",
  alternates: { canonical: "/drops" },
};

/** Every drop, newest first. Each opens on a date, in small numbers, and is never restocked. */
export default async function DropsPage() {
  const drops = await getDrops();

  return (
    <>
      <div className="px-gutter pt-10 pb-section">
        <div className="mx-auto flex max-w-site flex-col gap-16">
          <header className="flex flex-col gap-6">
            <Breadcrumbs items={[{ label: "Drops", href: "/drops" }]} />
            <Reveal>
              <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
                Limited runs · No restocks
              </p>
            </Reveal>
            <SplitText
              as="h1"
              immediate
              text={"Drops"}
              className="font-display text-hero01 font-bold"
            />
            <Reveal delay={0.2}>
              <p className="max-w-2xl text-body01 text-foreground-secondary">
                A few times a year we cut a small run that crosses two wardrobes. It opens at a set
                date and time, and when a size is gone it is gone.
              </p>
            </Reveal>
          </header>

          {drops.length === 0 ? (
            <p className="text-body01 text-foreground-secondary">
              No drops yet. Sign up below and you&apos;ll hear about the first one.
            </p>
          ) : (
            <ol className="flex flex-col gap-6">
              {drops.map((d, i) => {
                const { label, title } = splitDropName(d.name);
                return (
                  <Reveal as="li" key={d.slug} delay={0.05 * i}>
                    <Link
                      href={`/drops/${d.slug}`}
                      className="group grid gap-8 border border-border-strong p-6 transition-colors duration-200 hover:border-accent md:grid-cols-[1fr_1.1fr] md:p-10"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
                            {label}
                          </span>
                          <DropStatus startsAt={d.startsAt} endsAt={d.endsAt} compact />
                        </div>
                        <h2 className="font-display text-heading01 font-bold transition-colors group-hover:text-accent">
                          {title}
                        </h2>
                        <p className="max-w-md text-body01 text-foreground-secondary">
                          {d.description}
                        </p>
                        <p className="mt-auto font-mono text-caption01 tracking-[0.12em] text-foreground-subtle uppercase">
                          Opens {dropDateIST(d.startsAt)} · {d.products.length} pieces{" "}
                          <span
                            aria-hidden="true"
                            className="inline-block transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </p>
                      </div>
                      <ul className="grid grid-cols-4 gap-2 self-center" aria-hidden="true">
                        {d.products.slice(0, 4).map((p) => (
                          <li key={p.slug} className="relative aspect-[3/4] overflow-hidden">
                            <Visual product={p} view={0} />
                          </li>
                        ))}
                      </ul>
                    </Link>
                  </Reveal>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <DropAlertsSection />
    </>
  );
}
