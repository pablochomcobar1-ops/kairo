import "server-only";
import { createPublicClient } from "@/server/supabase/public";
import { signedReviewPhotos } from "@/server/reviews/store";
import { FEATURED_LOOK_SLUG } from "./featured";
import { buildSearchText } from "./search-text";
import type {
  CatalogProduct,
  CatalogSource,
  CollectionSlug,
  DropData,
  HomeData,
  LookPiece,
  ProductCardData,
  ProductDetail,
  ReviewData,
  ReviewSnippet,
  VariantData,
} from "./types";

const CARD_SELECT = `
  slug, name, price_paise, compare_at_paise, created_at,
  collection:collections!inner ( slug ),
  drop:drops ( slug, name, starts_at ),
  images:product_images ( path, alt, position ),
  variants ( stock )
` as const;

type CardRow = {
  slug: string;
  name: string;
  price_paise: number;
  compare_at_paise: number | null;
  collection: { slug: string } | null;
  drop: { slug: string; name?: string; starts_at?: string } | null;
  images: { path: string; alt: string; position: number }[] | null;
  variants: { stock: number }[] | null;
};

/** One database row → the card shape the pages use. Exported for tests. */
export function toCard(row: CardRow): ProductCardData {
  return {
    slug: row.slug,
    name: row.name,
    collection: (row.collection?.slug ?? "streetwear") as CollectionSlug,
    pricePaise: row.price_paise,
    compareAtPaise: row.compare_at_paise,
    images: [...(row.images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(({ path, alt }) => ({ path, alt })),
    totalStock: (row.variants ?? []).reduce((n, v) => n + v.stock, 0),
    dropSlug: row.drop?.slug ?? null,
  };
}

type VariantRow = { id: string; size: string; colour: string; stock: number; position: number };

/** Card fields plus the full size/colour list (named "sizes" so it never clashes with variants ( stock )). */
const PIECE_SELECT = `${CARD_SELECT}, sizes:variants ( id, size, colour, stock, position )`;
type PieceRow = CardRow & { sizes: VariantRow[] | null };

const toVariants = (rows: VariantRow[] | null): VariantData[] =>
  [...(rows ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ id, size, colour, stock }) => ({ id, size, colour, stock }));

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`Catalog: could not load ${what}${error ? `: ${error.message}` : ""}`);
}

export const supabaseSource: CatalogSource = {
  async getHomeData(): Promise<HomeData> {
    const db = createPublicClient();
    const nowIso = new Date().toISOString();

    const [newIn, drop, featured, reviews] = await Promise.all([
      db
        .from("products")
        .select(CARD_SELECT)
        .order("created_at", { ascending: false })
        .order("name")
        .limit(8),
      db
        .from("drops")
        .select("id, slug, name, description, starts_at, ends_at")
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
        .order("starts_at")
        .limit(1)
        .maybeSingle(),
      db.from("products").select(`${CARD_SELECT}, id`).eq("slug", FEATURED_LOOK_SLUG).maybeSingle(),
      db
        .from("reviews")
        .select(
          "id, author_name, rating, title, body, is_sample, is_verified, product:products!inner ( slug, name )",
        )
        .eq("status", "approved")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (newIn.error) fail("new in", newIn.error);
    if (drop.error) fail("drop", drop.error);
    if (featured.error) fail("featured look", featured.error);
    if (reviews.error) fail("reviews", reviews.error);

    let dropData: DropData | null = null;
    if (drop.data) {
      const products = await db
        .from("products")
        .select(CARD_SELECT)
        .eq("drop_id", drop.data.id)
        .order("name");
      if (products.error) fail("drop products", products.error);
      dropData = {
        slug: drop.data.slug,
        name: drop.data.name,
        description: drop.data.description,
        startsAt: drop.data.starts_at,
        endsAt: drop.data.ends_at,
        products: (products.data as unknown as CardRow[]).map(toCard),
      };
    }

    let look: LookPiece[] = [];
    if (featured.data) {
      const f = featured.data as unknown as CardRow & { id: string };
      const pairings = await db
        .from("product_pairings")
        .select("position, paired:products!product_pairings_paired_product_id_fkey ( slug )")
        .eq("product_id", f.id)
        .eq("kind", "look")
        .order("position");
      if (pairings.error) fail("look pairings", pairings.error);
      const slugs = [
        f.slug,
        ...(pairings.data ?? []).map((p) => (p.paired as unknown as { slug: string }).slug),
      ];
      const pieces = await db
        .from("products")
        .select(`${CARD_SELECT}, sizes:variants ( id, size, colour, stock, position )`)
        .in("slug", slugs);
      if (pieces.error) fail("look pieces", pieces.error);
      const bySlug = new Map(
        (
          pieces.data as unknown as (CardRow & {
            sizes: {
              id: string;
              size: string;
              colour: string;
              stock: number;
              position: number;
            }[];
          })[]
        ).map((p) => [p.slug, p]),
      );
      look = slugs
        .map((slug) => bySlug.get(slug))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => ({
          product: toCard(p),
          variants: [...p.sizes]
            .sort((a, b) => a.position - b.position)
            .map(({ id, size, colour, stock }) => ({ id, size, colour, stock })),
        }));
    }

    const reviewSnippets: ReviewSnippet[] = (reviews.data ?? []).map((r) => {
      const product = r.product as unknown as { slug: string; name: string };
      return {
        id: r.id,
        productSlug: product.slug,
        productName: product.name,
        author: r.author_name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isSample: r.is_sample,
        isVerified: r.is_verified,
      };
    });

    return {
      newIn: (newIn.data as unknown as CardRow[]).map(toCard),
      drop: dropData,
      look,
      reviews: reviewSnippets,
    };
  },

  async getCatalog(): Promise<CatalogProduct[]> {
    const db = createPublicClient();
    const { data, error } = await db
      .from("products")
      .select(`${PIECE_SELECT}, fabric, description`)
      .order("created_at", { ascending: false })
      .order("name");
    if (error) fail("catalog", error);
    type Row = PieceRow & { created_at: string; fabric: string; description: string };
    return (data as unknown as Row[]).map((row) => {
      const variants = toVariants(row.sizes);
      return {
        ...toCard(row),
        createdAt: row.created_at,
        variants,
        searchText: buildSearchText({
          name: row.name,
          collection: row.collection?.slug ?? "",
          fabric: row.fabric,
          description: row.description,
          colours: [...new Set(variants.map((v) => v.colour))],
        }),
      };
    });
  },

  async getProduct(slug: string): Promise<ProductDetail | null> {
    const db = createPublicClient();
    const product = await db
      .from("products")
      .select(`id, description, fabric, fit, care, ${PIECE_SELECT}`)
      .eq("slug", slug)
      .maybeSingle();
    if (product.error) fail(`product ${slug}`, product.error);
    if (!product.data) return null;
    type Row = PieceRow & {
      id: string;
      description: string;
      fabric: string;
      fit: string;
      care: string;
    };
    const row = product.data as unknown as Row;

    const [pairings, reviews] = await Promise.all([
      db
        .from("product_pairings")
        .select(
          `kind, position, paired:products!product_pairings_paired_product_id_fkey ( ${PIECE_SELECT} )`,
        )
        .eq("product_id", row.id)
        .order("position"),
      db
        .from("reviews")
        .select(
          "id, author_name, rating, title, body, is_sample, is_verified, created_at, photo_paths",
        )
        .eq("product_id", row.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (pairings.error) fail(`pairings for ${slug}`, pairings.error);
    if (reviews.error) fail(`reviews for ${slug}`, reviews.error);

    type PairRow = { kind: "look" | "another_way"; position: number; paired: PieceRow | null };
    const pairs = (pairings.data as unknown as PairRow[]).filter((p) => p.paired);
    const lookRows = pairs.filter((p) => p.kind === "look").map((p) => p.paired as PieceRow);
    const other = pairs.find((p) => p.kind === "another_way")?.paired ?? null;

    const signed = await signedReviewPhotos(
      (reviews.data ?? []).flatMap((r) => r.photo_paths ?? []),
    );
    const reviewList: ReviewData[] = (reviews.data ?? []).map((r) => ({
      id: r.id,
      productSlug: row.slug,
      productName: row.name,
      author: r.author_name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isSample: r.is_sample,
      isVerified: r.is_verified,
      createdAt: r.created_at,
      photos: (r.photo_paths ?? []).flatMap((path) => signed.get(path) ?? []),
    }));
    const total = reviewList.reduce((n, r) => n + r.rating, 0);

    return {
      ...toCard(row),
      description: row.description,
      fabric: row.fabric,
      fit: row.fit,
      care: row.care,
      variants: toVariants(row.sizes),
      drop: row.drop
        ? { slug: row.drop.slug, name: row.drop.name ?? "", startsAt: row.drop.starts_at ?? "" }
        : null,
      look: [row, ...lookRows].map((p) => ({ product: toCard(p), variants: toVariants(p.sizes) })),
      anotherWay: other ? toCard(other) : null,
      reviews: reviewList,
      rating: {
        average: reviewList.length ? Math.round((total / reviewList.length) * 10) / 10 : 0,
        count: reviewList.length,
      },
    };
  },
};
