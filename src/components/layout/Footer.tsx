import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/icons";
import { COLLECTIONS } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { CollectionLink } from "./CollectionLink";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Help",
    links: [
      ["Track an order", "/track"],
      ["Size guide", "/size-guide"],
      ["Shipping and returns", "/shipping-returns"],
      ["FAQ", "/faq"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Kairo",
    links: [
      ["About", "/about"],
      ["Lookbook", "/lookbook"],
      ["Drops", "/drops"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

const link = "inline-flex min-h-9 items-center text-body02 text-foreground-secondary transition-colors duration-150 hover:text-foreground";

export function Footer() {
  const year = 2026;
  return (
    <footer className="mt-section overflow-hidden border-t border-border">
      <div className="mx-auto grid max-w-site gap-10 px-gutter pb-12 pt-16 sm:grid-cols-2 lg:grid-cols-4">
        <nav aria-labelledby="footer-shop">
          <h2 id="footer-shop" className="mb-4 font-mono text-caption01 uppercase text-foreground-subtle">
            Shop
          </h2>
          <ul>
            {COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <CollectionLink href={c.href} className={link}>
                  {c.name}
                </CollectionLink>
              </li>
            ))}
            <li>
              <Link href="/shop" className={link}>
                Shop all
              </Link>
            </li>
          </ul>
        </nav>
        {columns.map((col) => (
          <nav key={col.title} aria-labelledby={`footer-${col.title.toLowerCase()}`}>
            <h2 id={`footer-${col.title.toLowerCase()}`} className="mb-4 font-mono text-caption01 uppercase text-foreground-subtle">
              {col.title}
            </h2>
            <ul>
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className={link}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <Reveal y={60} className="mx-auto max-w-site overflow-hidden px-gutter pt-4">
        <p
          aria-hidden="true"
          className="select-none pb-[0.06em] text-center font-display text-[clamp(3.25rem,16.5vw,15.5rem)] font-bold leading-none tracking-[0.06em] text-foreground/90"
        >
          KAIRO
        </p>
      </Reveal>

      <div className="mx-auto flex max-w-site flex-col gap-4 border-t border-border px-gutter py-6 text-body02 text-foreground-subtle md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {SITE.name}, {SITE.city}. Kairo is a concept brand. Images are AI concept visuals.
        </p>
        <a
          href={SITE.creditUrl}
          target="_blank"
          rel="noopener"
          className="group inline-flex min-h-11 items-center gap-2 text-foreground-secondary transition-colors duration-150 hover:text-accent"
        >
          Designed &amp; built by <span className="font-semibold text-foreground group-hover:text-accent">{SITE.creditName}</span>
          <ArrowRightIcon size={16} className="transition-transform duration-200 ease-ui group-hover:translate-x-1" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
