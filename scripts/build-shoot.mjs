// Writes docs/photo-shoot.md: every prompt for the Kairo photo shoot,
// straight from the catalog. Run with `npm run photos:prompts` after
// changing products or the art direction in scripts/lib/photos.mjs.
import { writeFileSync } from "node:fs";
import path from "node:path";
import * as catalog from "../supabase/seed/catalog.mjs";
import { promptsFor, SHOOT } from "./lib/photos.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const out = [];
const w = (s = "") => out.push(s);

w("# Kairo photo shoot");
w();
w(
  `${catalog.products.length} products × 2 photos. Generated from the catalog by \`npm run photos:prompts\`; don't edit by hand.`,
);
w();
w("## How it works");
w();
w("1. Paste a prompt into your image tool (ChatGPT, Gemini, Midjourney, Leonardo… any of them).");
w(
  "2. Save the result in the folder named under each product, as `1.jpg` (worn) or `2.jpg` (close-up). Any of jpg, png, webp or avif. At least 600×800; bigger is better.",
);
w(
  "3. When a few are in, run `npm run photos -- --check` to test the folder, then `npm run photos` to upload.",
);
w("4. Set `NEXT_PUBLIC_PRODUCT_PHOTOS=1` in `.env.local` and restart `npm run dev`.");
w();
w("```");
w("kairo/");
w("  photos/                  ← next to package.json (never uploaded to GitHub)");
w("    static-heavy-tee/");
w("      1.jpg                ← worn");
w("      2.jpg                ← close-up (optional)");
w("    boardroom-blazer/");
w("      1.png");
w("```");
w();
w(
  "You don't need all of them at once. Pieces without a photo keep their drawing; the worn photo (1) matters most.",
);
w();
w("## Before you keep a picture, check");
w();
w(
  "- **One man only.** No women anywhere in the frame, including in the background. Regenerate if there are.",
);
w("- The garment matches: right colour, right kind of piece, sensible details.");
w("- Hands, fingers and faces look natural.");
w("- No text, logos, brand names or watermarks.");
w(
  "- The same collection looks like one shoot: same model, set and light. Generating a whole collection in one chat helps the tool stay consistent.",
);
w();
w("These are AI concept visuals; the site says so in the footer and on the About page.");
w();

for (const c of catalog.collections) {
  const s = SHOOT[c.slug];
  const items = catalog.products.filter((p) => p.collection === c.slug);
  w(`## ${c.name}`);
  w();
  w(`**Model:** ${s.model}. **Set:** ${s.set}. **Light:** ${s.light}.`);
  w();
  for (const p of items) {
    const { front, detail } = promptsFor(p);
    w(`### ${p.name}`);
    w();
    w(`Folder: \`photos/${p.slug}/\` · colour: ${p.colours[0]}`);
    w();
    w("**1.jpg: worn**");
    w();
    w("```text");
    w(front);
    w("```");
    w();
    w("**2.jpg: close-up**");
    w();
    w("```text");
    w(detail);
    w("```");
    w();
  }
}

const file = path.join(ROOT, "docs", "photo-shoot.md");
writeFileSync(file, out.join("\n"));
console.log(
  `Wrote ${path.relative(ROOT, file)} (${catalog.products.length} products, ${catalog.products.length * 2} prompts).`,
);
