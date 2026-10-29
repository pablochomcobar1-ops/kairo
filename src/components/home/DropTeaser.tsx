import Link from "next/link";
import type { DropData } from "@/server/catalog/types";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonClasses } from "@/components/ui/Button";
import { dropDateIST } from "@/lib/countdown";
import { Countdown } from "./Countdown";
import { DropAlertForm } from "./DropAlertForm";

/** 4 · The next drop: countdown, the pieces, and "notify me". */
export function DropTeaser({ drop }: { drop: DropData }) {
  const [label, title] = drop.name.includes("—")
    ? drop.name.split("—").map((s) => s.trim())
    : ["Next drop", drop.name];

  return (
    <section aria-labelledby="drop-title" className="relative overflow-hidden px-gutter py-section">
      {/* brass glow behind the countdown */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -left-1/4 h-[60rem] w-[60rem] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--k-accent) 22%, transparent), transparent)",
        }}
      />
      <div className="relative mx-auto grid max-w-site gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-8">
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {label} · {dropDateIST(drop.startsAt)}
            </p>
          </Reveal>
          <div id="drop-title">
            <SplitText text={title} className="font-display text-hero02 font-bold" />
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-lg text-body01 text-foreground-secondary">{drop.description}</p>
          </Reveal>
          <Reveal delay={0.25}>
            <Countdown target={drop.startsAt} />
          </Reveal>
          <Reveal delay={0.35} className="flex flex-col gap-6">
            <DropAlertForm dropSlug={drop.slug} label="Get the drop by email" />
            <Link
              href={`/drops/${drop.slug}`}
              className={buttonClasses("ghost", "md", "self-start px-0")}
            >
              See the drop →
            </Link>
          </Reveal>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 self-start md:gap-x-6">
          {drop.products.slice(0, 4).map((p, i) => (
            <Reveal
              as="li"
              key={p.slug}
              delay={0.1 * i}
              y={40}
              className={i % 2 === 1 ? "md:translate-y-16" : undefined}
            >
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
