import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WishlistButton } from "@/components/account/WishlistButton";
import { CompleteTheLook } from "@/components/home/CompleteTheLook";
import { Breadcrumbs, jsonLdString } from "@/components/layout/Breadcrumbs";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { PageTheme } from "@/components/layout/PageTheme";
import { Reveal } from "@/components/motion/Reveal";
import { BuyBox } from "@/components/product/BuyBox";
import { DropGate } from "@/components/product/DropGate";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import { Stars } from "@/components/product/Stars";
import { Accordion } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { COLLECTIONS, collectionBySlug } from "@/lib/collections";
import { productImageUrl } from "@/lib/images";
import { POLICY } from "@/lib/policies";
import { publicSiteUrl } from "@/lib/site-url";
import { getCatalog, getProduct } from "@/server/catalog";
import type { ProductDetail } from "@/server/catalog/types";

type Props = PageProps<"/products/[slug]">;

export async function generateStaticParams() {
  const all = await getCatalog();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Not found", robots: { index: false } };
  const collection = collectionBySlug(p.collection);
  const description =
    `${p.description} ${collection ? `From the ${collection.name} collection.` : ""}`.trim();
  const image = productImageUrl(p.images[0]?.path);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: `${p.name} · KAIRO`,
      description,
      url: `/products/${p.slug}`,
      ...(image ? { images: [{ url: image, alt: p.images[0]?.alt }] } : {}),
    },
  };
}

/**
 * A product, in its collection's theme. Reading the URL happens inside
 * <Suspense>; every known product is prerendered, so the page arrives whole.
 */
export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const collection = collectionBySlug(p.collection) ?? COLLECTIONS[0];
  const otherCollection = p.anotherWay ? collectionBySlug(p.anotherWay.collection) : undefined;

  return (
    <>
      <PageTheme theme={collection.theme} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(p)) }}
      />

      <div className="px-gutter pt-6 md:pt-10">
        <div className="mx-auto max-w-site">
          <Breadcrumbs
            items={[
              { label: collection.name, href: collection.href },
              { label: p.name, href: `/products/${p.slug}` },
            ]}
          />

          <div className="mt-6 grid gap-10 md:grid-cols-[7fr_5fr] lg:gap-16">
            <ProductGallery name={p.name} collection={p.collection} images={p.images} />

            <div className="flex flex-col gap-8 self-start md:sticky md:top-24">
              <header className="flex flex-col gap-4">
                <CollectionLink
                  href={collection.href}
                  className="self-start font-mono text-caption01 tracking-[0.2em] text-accent uppercase hover:underline hover:underline-offset-4"
                >
                  {collection.number} · {collection.name}
                </CollectionLink>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-display text-heading01 leading-tight font-bold">{p.name}</h1>
                  <WishlistButton
                    slug={p.slug}
                    name={p.name}
                    size={22}
                    className="-mt-1 -mr-2 shrink-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Price
                    paise={p.pricePaise}
                    compareAtPaise={p.compareAtPaise}
                    className="text-heading03"
                  />
                  {p.rating.count > 0 && (
                    <a
                      href="#reviews"
                      className="inline-flex items-center gap-2 text-body02 text-foreground-secondary hover:text-foreground"
                    >
                      <Stars rating={p.rating.average} size={14} />
                      <span className="underline underline-offset-4">
                        {p.rating.count} {p.rating.count === 1 ? "review" : "reviews"}
                      </span>
                    </a>
                  )}
                </div>
                {p.drop && (
                  <Badge tone="accent" className="self-start">
                    {p.drop.name.split("—")[0].trim()}
                  </Badge>
                )}
              </header>

              <DropGate drop={p.drop}>
                <BuyBox product={p} variants={p.variants} sticky />
              </DropGate>

              <p className="font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase">
                {POLICY.short}
              </p>

              <p className="text-body01 text-foreground-secondary">{p.description}</p>

              <Accordion
                defaultOpen="fabric"
                items={[
                  { id: "fabric", title: "Fabric", content: <p>{p.fabric}</p> },
                  { id: "fit", title: "Fit", content: <p>{p.fit}</p> },
                  { id: "care", title: "Care", content: <p>{p.care}</p> },
                  {
                    id: "delivery",
                    title: "Delivery & returns",
                    content: (
                      <div className="flex flex-col gap-2">
                        <p>{POLICY.delivery}</p>
                        <p>{POLICY.returns}</p>
                        <Link
                          href="/shipping-returns"
                          className="text-accent underline underline-offset-4"
                        >
                          Full policy
                        </Link>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {p.look.length > 1 && (
        <div className="mt-section">
          <CompleteTheLook look={p.look} title={"Wear it\nwith"} />
        </div>
      )}

      {p.anotherWay && otherCollection && (
        <section aria-labelledby="another-way" className="px-gutter py-section">
          <div className="mx-auto grid max-w-site items-center gap-10 md:grid-cols-[1fr_20rem] md:gap-20">
            <Reveal className="flex flex-col gap-5">
              <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
                Wear it another way
              </p>
              <h2 id="another-way" className="font-display text-heading01 font-bold">
                Same you. {otherCollection.name} hours.
              </h2>
              <p className="max-w-md text-body01 text-foreground-secondary">
                The {p.name} sits just as well next to the {p.anotherWay.name}, from{" "}
                {otherCollection.name}.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ProductCard product={p.anotherWay} />
            </Reveal>
          </div>
        </section>
      )}

      <div className="px-gutter">
        <div className="mx-auto max-w-site">
          <ProductReviews
            reviews={p.reviews}
            rating={p.rating}
            product={{ slug: p.slug, name: p.name }}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Structured data for Google. A star rating is only included when real
 * (non-sample) reviews exist: sample reviews never feed search results.
 */
function productJsonLd(p: ProductDetail) {
  const base = publicSiteUrl();
  const real = p.reviews.filter((r) => !r.isSample);
  const image = productImageUrl(p.images[0]?.path);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: "KAIRO" },
    url: `${base}/products/${p.slug}`,
    ...(image ? { image: [image] } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (p.pricePaise / 100).toFixed(2),
      availability:
        p.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${base}/products/${p.slug}`,
    },
    ...(real.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (real.reduce((n, r) => n + r.rating, 0) / real.length).toFixed(1),
            reviewCount: real.length,
          },
        }
      : {}),
  };
}

function ProductSkeleton() {
  return (
    <div className="px-gutter pt-10" aria-busy="true">
      <div className="mx-auto grid max-w-site gap-10 md:grid-cols-[7fr_5fr] lg:gap-16">
        <Skeleton className="aspect-[3/4]" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-28" />
          <Skeleton className="h-14" />
        </div>
      </div>
    </div>
  );
}
