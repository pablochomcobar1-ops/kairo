import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";
import { SizeTable } from "@/components/product/SizeTable";
import { SIZE_TABLES, type SizeTableId } from "@/lib/size-guide";

export const metadata: Metadata = {
  title: "Size guide",
  description:
    "Kairo body measurements for tops, trousers, tailoring and riding gloves, with how to measure.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  const tables = Object.keys(SIZE_TABLES) as SizeTableId[];
  return (
    <InfoPage
      crumbs={[{ label: "Size guide", href: "/size-guide" }]}
      eyebrow="Help · Fit"
      title="Size guide"
      intro="Body measurements, not garment measurements: measure yourself over a thin layer and pick the row that fits. Each product page also says how that piece fits."
    >
      <div className="flex flex-col gap-16">
        {tables.map((id) => (
          <section key={id} id={id} className="scroll-mt-28">
            <SizeTable table={id} showTitle />
          </section>
        ))}
        <InfoSection title="Still unsure?">
          <p>
            Between two sizes, take the larger for a relaxed fit or the smaller for a close one.
            Exchanges for another size are free within 7 days of delivery.
          </p>
        </InfoSection>
      </div>
    </InfoPage>
  );
}
