import type { Metadata } from "next";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog, Drawer } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowRightIcon, BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-border pt-10">
      <h2 id={id} className="font-mono text-caption01 uppercase text-foreground-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Every building block on one page, in the current theme. Hidden from search engines. */
export default function Styleguide() {
  return (
    <main className="mx-auto flex max-w-site flex-col gap-14 px-gutter py-section">
      <header className="flex flex-col gap-5">
        <p className="font-mono text-caption01 uppercase text-accent">KAIRO · Design system</p>
        <SplitText as="h1" immediate text={"Cut once.\nWorn for years."} className="font-display text-hero02 font-bold" />
        <p className="max-w-prose text-body01 text-foreground-secondary">
          The pieces every page is built from. Open a collection to see them re-colour themselves.
        </p>
        <nav aria-label="Preview in a collection theme" className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["streetwear", "Streetwear"],
            ["formal", "Formal"],
            ["old-money", "Old Money"],
            ["riding", "Riding"],
          ].map(([slug, label]) => (
            <CollectionLink key={slug} href={`/collections/${slug}`} className="font-mono text-caption01 uppercase underline-offset-4 hover:text-accent hover:underline">
              {label} →
            </CollectionLink>
          ))}
        </nav>
      </header>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <MagneticButton>
            <Button size="lg">
              Enter the wardrobe <ArrowRightIcon size={16} />
            </Button>
          </MagneticButton>
          <Button variant="outline" size="lg">
            Shop new in
          </Button>
          <Button>Add to bag</Button>
          <Button loading>Add to bag</Button>
          <Button disabled>Sold out</Button>
          <ButtonLink href="/" variant="ghost">
            Read the story
          </ButtonLink>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Search" icon={<SearchIcon />} />
          <IconButton label="Wishlist" icon={<HeartIcon />} />
          <IconButton label="Account" icon={<UserIcon />} />
          <IconButton label="Open bag" icon={<BagIcon />} count={2} />
          <IconButton label="Open menu" icon={<MenuIcon />} />
        </div>
      </Section>

      <Section id="prices" title="Prices and badges">
        <div className="flex flex-wrap items-center gap-6 text-heading03">
          <Price paise={1490000} />
          <Price paise={890000} compareAtPaise={990000} />
          <Price paise={180000} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge tone="accent">Drop 01</Badge>
          <Badge tone="inverse">New</Badge>
          <Badge>8 left</Badge>
          <Badge tone="verified">Verified buyer</Badge>
          <Badge tone="sample">Sample</Badge>
        </div>
      </Section>

      <Section id="fields" title="Form fields">
        <div className="grid gap-8 sm:grid-cols-2">
          <Input label="Full name" autoComplete="name" placeholder="Jainam Gondaliya" />
          <Input label="Mobile" inputMode="numeric" autoComplete="tel-national" hint="10 digits, for delivery updates" />
          <Input label="Pincode" defaultValue="38001" error="Enter a 6-digit pincode" />
          <Select label="Size" defaultValue="M">
            {["S", "M", "L", "XL", "XXL"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Textarea label="Message" className="sm:col-span-2" placeholder="Ask about sizes, orders or returns" />
        </div>
      </Section>

      <Section id="overlays" title="Dialogs and drawers">
        <div className="flex flex-wrap gap-4">
          <Dialog
            title="Size guide"
            description="Body measurements in inches"
            trigger={<Button variant="outline">Size guide</Button>}
          >
            <table className="w-full text-left text-body02">
              <thead className="font-mono text-caption02 uppercase text-foreground-subtle">
                <tr>
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Waist</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "36–38", "30–32"],
                  ["M", "38–40", "32–34"],
                  ["L", "40–42", "34–36"],
                  ["XL", "42–44", "36–38"],
                ].map(([s, c, w]) => (
                  <tr key={s} className="border-t border-border">
                    <td className="py-3 font-mono">{s}</td>
                    <td className="py-3">{c}</td>
                    <td className="py-3">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Dialog>
          <Drawer
            title="Your bag (2)"
            trigger={<Button variant="outline">Cart drawer</Button>}
            footer={<Button className="w-full">Checkout · ₹17,100</Button>}
          >
            <p className="text-body02 text-foreground-secondary">Cart lines arrive in Task 4.</p>
          </Drawer>
          <Drawer title="Menu" side="left" trigger={<Button variant="outline">Menu drawer</Button>}>
            <p className="text-body02 text-foreground-secondary">The full mobile menu arrives in Task 4.</p>
          </Drawer>
        </div>
      </Section>

      <Section id="accordion" title="Accordion">
        <Accordion
          className="max-w-2xl"
          defaultOpen="fabric"
          items={[
            { id: "fabric", title: "Fabric", content: "Waxed cotton shell, quilted lining, CE armour at shoulders and elbows." },
            { id: "fit", title: "Fit", content: "Regular, with room for a hoodie underneath." },
            { id: "care", title: "Care", content: "Re-wax once a season. Remove armour before cleaning." },
          ]}
        />
      </Section>

      <Section id="motion" title="Reveal on scroll">
        <div className="grid gap-4 sm:grid-cols-3">
          {["Rises at the theme's speed", "Old Money is slower", "Riding is fastest"].map((t, i) => (
            <Reveal key={t} delay={i * 0.08} className="flex h-40 items-end bg-background-tertiary p-5 text-heading03">
              {t}
            </Reveal>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3" aria-label="Loading placeholders">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </Section>
    </main>
  );
}
