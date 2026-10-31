import type { Metadata } from "next";
import { CompleteTheLook } from "@/components/home/CompleteTheLook";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { collectionBySlug } from "@/lib/collections";
import { getProduct } from "@/server/catalog";
import { LOOKBOOK } from "@/server/catalog/featured";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Four outfits, one per Kairo wardrobe: Streetwear, Formal, Old Money and Riding. Pick sizes and add the whole look to your bag.",
  alternates: { canonical: "/lookbook" },
};

/** One full outfit per wardrobe, each in its own colours, each addable to the bag in one go. */
export default async function LookbookPage() {
  const looks = (
    await Promise.all(
      LOOKBOOK.map(async (l) => {
        const p = await getProduct(l.lead);
        return p && p.look.length > 1 ? { ...l, look: p.look, collection: p.collection } : null;
      }),
    )
  ).filter((l) => l !== null);

  return (
    <>
      <header className="px-gutter pt-10 pb-16">
        <div className="mx-auto flex max-w-site flex-col gap-6">
          <Breadcrumbs items={[{ label: "Lookbook", href: "/lookbook" }]} />
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              Autumn / Winter 2026 · {looks.length} looks
            </p>
          </Reveal>
          <SplitText
            as="h1"
            immediate
            text="Lookbook"
            className="font-display text-hero01 font-bold"
          />
          <Reveal delay={0.2}>
            <p className="max-w-2xl text-body01 text-foreground-secondary">
              Four lives, four outfits. Every piece in a look is sold on its own, but they were cut
              to be worn together. Choose your sizes and take the whole look at once.
            </p>
          </Reveal>
        </div>
      </header>
      {looks.map((l, i) => {
        const c = collectionBySlug(l.collection);
        return (
          <CompleteTheLook
            key={l.lead}
            look={l.look}
            title={l.title}
            eyebrow={`Look ${String(i + 1).padStart(2, "0")} · ${c?.name ?? ""}`}
          />
        );
      })}
    </>
  );
}
