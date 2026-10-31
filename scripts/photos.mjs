// npm run photos            → import the shoot from ./photos into Supabase
// npm run photos -- --check → only check the folder, change nothing
// npm run photos:prompts    → rewrite docs/photo-shoot.md
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
// For every product folder in ./photos it crops each picture to 3:4,
// saves it as a small AVIF, uploads it to the public "products" bucket and
// points the product at the new pictures. Products without photos are left
// alone (the site keeps drawing their artwork).

import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import * as catalog from "../supabase/seed/catalog.mjs";
import { ACCEPTED, altFor, PHOTO_SIZE, planImport, storagePath } from "./lib/photos.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "photos");
const checkOnly = process.argv.includes("--check");

const say = (...a) => console.log(...a);
const stop = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

if (!existsSync(DIR))
  stop(
    `No "photos" folder. Make one next to package.json, with a folder per product (see docs/photo-shoot.md).`,
  );

const files = readdirSync(DIR, { recursive: true })
  .map((f) => String(f).split(path.sep).join("/"))
  .filter((f) => statSync(path.join(DIR, f)).isFile());
const { plan, problems } = planImport(
  files.filter((f) => ACCEPTED.test(f) || !f.split("/").at(-1).startsWith(".")),
  catalog.products,
);

say(`\nFound photos for ${plan.size} of ${catalog.products.length} products.`);
if (problems.length) {
  say("\nFix these first:");
  for (const p of problems) say(`  • ${p}`);
  stop("Nothing was uploaded.");
}
if (plan.size === 0) stop("The photos folder has no product folders yet.");

// read and convert everything before touching Supabase, so one bad file stops it all
const prepared = [];
for (const [slug, { product, photos }] of plan) {
  for (const n of [1, 2]) {
    if (!photos[n]) continue;
    const src = path.join(DIR, photos[n]);
    let meta;
    try {
      meta = await sharp(src).metadata();
    } catch {
      stop(`${photos[n]} isn't a readable image.`);
    }
    if ((meta.width ?? 0) < 600 || (meta.height ?? 0) < 800)
      stop(
        `${photos[n]} is only ${meta.width}×${meta.height}. Use at least 600×800 (bigger is better).`,
      );
    const out = await sharp(src)
      .rotate() // respect phone orientation
      .resize(PHOTO_SIZE.width, PHOTO_SIZE.height, { fit: "cover", position: "attention" })
      .avif({ quality: 58, effort: 5 })
      .toBuffer(); // metadata (location, camera) is dropped
    const hash = createHash("sha256").update(out).digest("hex");
    prepared.push({
      slug,
      product,
      n,
      bytes: out,
      path: storagePath(slug, n, hash),
      from: photos[n],
    });
  }
}
for (const p of prepared)
  say(`  ${p.from.padEnd(42)} → ${p.path}  (${Math.round(p.bytes.length / 1024)} KB)`);

if (checkOnly) {
  say("\n✔ Everything looks right. Run `npm run photos` to upload.\n");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key)
  stop("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

say("\nUploading…");
for (const [slug] of plan) {
  const mine = prepared.filter((p) => p.slug === slug);
  for (const p of mine) {
    const { error } = await db.storage
      .from("products")
      .upload(p.path, p.bytes, {
        contentType: "image/avif",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) stop(`Upload of ${p.from} failed: ${error.message}`);
  }

  const { data: row, error: findError } = await db
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (findError || !row)
    stop(
      `Product ${slug} isn't in the database (${findError?.message ?? "not found"}). Was the seed run?`,
    );

  // swap the product's picture rows for the new ones
  const { error: delError } = await db.from("product_images").delete().eq("product_id", row.id);
  if (delError) stop(`Couldn't update ${slug}'s pictures: ${delError.message}`);
  const { error: insError } = await db
    .from("product_images")
    .insert(
      mine.map((p) => ({
        product_id: row.id,
        path: p.path,
        alt: altFor(p.product, p.n),
        position: p.n - 1,
      })),
    );
  if (insError) stop(`Couldn't save ${slug}'s pictures: ${insError.message}`);

  // remove this product's older uploads
  const { data: existing } = await db.storage.from("products").list(slug);
  const keep = new Set(mine.map((p) => p.path.split("/")[1]));
  const old = (existing ?? []).filter((o) => !keep.has(o.name)).map((o) => `${slug}/${o.name}`);
  if (old.length) await db.storage.from("products").remove(old);

  say(`  ✔ ${slug}`);
}

// the original seed listed <slug>/1.avif and <slug>/2.avif for every product before any
// photo existed; drop those placeholders so pieces without photos keep their drawings
const placeholders = catalog.products.flatMap((p) => [`${p.slug}/1.avif`, `${p.slug}/2.avif`]);
const { error: phError, count } = await db
  .from("product_images")
  .delete({ count: "exact" })
  .in("path", placeholders);
if (phError) stop(`Couldn't clear the placeholder pictures: ${phError.message}`);
if (count)
  say(`  ✔ removed ${count} placeholder picture links (pieces without photos show their drawing)`);

say(`
✔ Done: ${plan.size} products now have photos.
  Make sure NEXT_PUBLIC_PRODUCT_PHOTOS=1 is in .env.local, then restart npm run dev.
`);
