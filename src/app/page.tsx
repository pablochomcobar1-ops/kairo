import { CollectionLink } from "@/components/layout/CollectionLink";

const COLLECTIONS = [
  ["streetwear", "Streetwear"],
  ["formal", "Formal"],
  ["old-money", "Old Money"],
  ["riding", "Riding"],
] as const;

/**
 * Temporary check page — not the real home page (that arrives in Task 6).
 * Shows the fonts, the type scale and all five themes from design tokens.
 */
export default function FoundationCheck() {
  const scale = [
    ["hero01", "text-hero01 font-display font-bold"],
    ["hero02", "text-hero02 font-display font-bold"],
    ["heading01", "text-heading01 font-display font-bold"],
    ["heading02", "text-heading02 font-semibold"],
    ["heading03", "text-heading03 font-semibold"],
    ["body01", "text-body01"],
    ["body02", "text-body02 text-foreground-secondary"],
    ["caption01", "text-caption01 font-mono uppercase text-foreground-subtle"],
  ] as const;

  return (
    <main className="mx-auto flex max-w-site flex-col gap-16 px-gutter py-section">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-caption01 uppercase text-accent">Task 2 · Theme transitions</p>
        <h1 className="font-display text-hero01 font-bold uppercase">Four lives.<br />One label.</h1>
        <p className="max-w-prose text-body01 text-foreground-secondary">
          Task 2 check: open a collection. The curtain should wipe in its colour with the name,
          the page should change underneath, and the curtain should lift. Use the browser&apos;s back
          button too: no curtain, but the colours must always match the page.
        </p>
        <nav aria-label="Collections" className="flex flex-wrap gap-3">
          {COLLECTIONS.map(([slug, label]) => (
            <CollectionLink
              key={slug}
              href={`/collections/${slug}`}
              className="flex min-h-11 items-center border border-border-strong px-5 font-mono text-caption01 uppercase transition-colors hover:border-accent hover:text-accent"
            >
              {label}
            </CollectionLink>
          ))}
        </nav>
      </header>

      <section aria-labelledby="scale" className="flex flex-col gap-6 border-t border-border pt-10">
        <h2 id="scale" className="font-mono text-caption01 uppercase text-foreground-subtle">
          Type scale
        </h2>
        <ul className="flex flex-col gap-5">
          {scale.map(([name, cls]) => (
            <li key={name} className="flex flex-col gap-1">
              <span className="font-mono text-caption02 uppercase text-foreground-subtle">{name}</span>
              <span className={cls}>Nightfall Riding Jacket</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="swatches" className="flex flex-col gap-6 border-t border-border pt-10">
        <h2 id="swatches" className="font-mono text-caption01 uppercase text-foreground-subtle">
          Current theme
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex h-24 items-end border border-border-strong bg-background p-3 font-mono text-caption02 uppercase">background</div>
          <div className="flex h-24 items-end bg-background-tertiary p-3 font-mono text-caption02 uppercase">surface</div>
          <div className="flex h-24 items-end bg-foreground p-3 font-mono text-caption02 uppercase text-background">foreground</div>
          <div className="flex h-24 items-end bg-accent p-3 font-mono text-caption02 uppercase text-accent-foreground">accent</div>
        </div>
        <p className="font-mono text-body02">
          Price sample: <span className="text-accent">₹14,900</span> · Size M · 12 left
        </p>
      </section>
    </main>
  );
}
