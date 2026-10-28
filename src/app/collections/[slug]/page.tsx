import { notFound } from "next/navigation";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { PageTheme } from "@/components/layout/PageTheme";
import { THEMES, themeForCollection } from "@/lib/theme";

/**
 * TEMPORARY stand-in for the collection page (Task 2 check).
 * The real page with products, filters and 3D arrives in Task 7.
 */

const SLUGS = ["streetwear", "formal", "old-money", "riding"] as const;
const TAGLINES: Record<(typeof SLUGS)[number], string> = {
  streetwear: "Built for 2 AM.",
  formal: "Walk in. Close it.",
  "old-money": "Never loud. Always noticed.",
  riding: "Made for the long way home.",
};

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default async function CollectionStub({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) notFound();
  const theme = themeForCollection(slug);
  const info = THEMES[theme];
  const others = SLUGS.filter((s) => s !== slug);

  return (
    <main className="mx-auto flex min-h-svh max-w-site flex-col justify-between gap-16 px-gutter py-section">
      <PageTheme theme={theme} />
      <header className="flex flex-col gap-5">
        <p className="font-mono text-caption01 uppercase text-accent">
          {String(SLUGS.indexOf(slug as (typeof SLUGS)[number]) + 1).padStart(2, "0")} · {info.mood}
        </p>
        <h1 className="font-display text-hero01 font-bold">{info.label}</h1>
        <p className="text-heading03 text-foreground-secondary">
          {TAGLINES[slug as (typeof SLUGS)[number]]}
        </p>
      </header>

      <nav aria-label="Other wardrobes" className="flex flex-col gap-4 border-t border-border pt-8">
        <p className="font-mono text-caption01 uppercase text-foreground-subtle">The other three wardrobes</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {others.map((s) => (
            <li key={s}>
              <CollectionLink
                href={`/collections/${s}`}
                className="flex min-h-24 items-end border border-border-strong p-4 font-display text-heading03 font-bold transition-colors hover:border-accent hover:text-accent"
              >
                {THEMES[themeForCollection(s)].label}
              </CollectionLink>
            </li>
          ))}
        </ul>
        <CollectionLink href="/" className="self-start font-mono text-caption01 uppercase underline-offset-4 hover:underline">
          ← Back to Noir
        </CollectionLink>
      </nav>
    </main>
  );
}
