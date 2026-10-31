// The Kairo photo shoot: prompts for every product, and the rules for
// importing the finished photos. Plain JavaScript so `npm run photos` runs
// without a build; tested in tests/unit/photos.test.ts.
//
// Male models only, in every image (the brief).

/** One art direction per wardrobe, so each collection looks like one shoot. */
export const SHOOT = {
  streetwear: {
    model: "a young Indian man in his early 20s with short textured black hair and light stubble",
    set: "a rain-wet city street at night, a bare concrete wall behind him, violet and blue neon reflecting on the wet ground",
    light: "cool violet neon rim light with a soft white key light from the front",
    mood: "confident, relaxed, looking just past the camera",
  },
  formal: {
    model: "an Indian man in his early 30s with neatly side-parted black hair, clean-shaven",
    set: "a dim tailor's atelier, dark wooden shelves with bolts of cloth softly blurred behind him",
    light: "warm tungsten key light from one side, deep soft shadows",
    mood: "composed and assured, looking at the camera",
  },
  "old-money": {
    model: "an Indian man in his early 30s with swept-back hair and a neatly trimmed beard",
    set: "a sunlit old library with ivory walls, tall windows and a worn leather armchair, softly blurred",
    light: "bright, soft natural window light, warm and airy, gentle film-like tones",
    mood: "calm and unhurried, a faint smile",
  },
  riding: {
    model: "a rugged Indian man in his late 20s with short hair and stubble",
    set: "an empty highway at dusk, a cruiser motorcycle beside him, amber street lights coming on",
    light: "warm amber backlight against a deep blue dusk sky, soft fill on the face",
    mood: "steady and focused, looking down the road",
  },
};

const STYLE =
  "Photorealistic editorial fashion e-commerce photograph, vertical 3:4 portrait, shot on an 85mm lens, shallow depth of field, natural skin texture, true-to-life fabric colour.";
const RULES =
  "Exactly one person: an adult man. No women. No text, no logos, no watermark, no brand names.";

/** Same rules as src/lib/images.ts garmentKind (a test keeps them in step). */
export function garmentKind(name) {
  const n = name.toLowerCase();
  if (/glove/.test(n)) return "gloves";
  if (/\btie\b/.test(n)) return "tie";
  if (/hoodie/.test(n)) return "hoodie";
  if (/trouser|cargo|jean|pant|denim|chino/.test(n)) return "trouser";
  if (/jacket|blazer|coat|suit|shell/.test(n)) return "jacket";
  if (/sweater|turtleneck|knit|base layer/.test(n)) return "knit";
  if (/shirt|polo|rugby/.test(n)) return "shirt";
  return "tee";
}

const FRAMING = {
  tee: "framed from the top of his head to mid-thigh, the whole garment clearly visible",
  shirt: "framed from the top of his head to mid-thigh, the whole garment clearly visible",
  knit: "framed from the top of his head to mid-thigh, the whole garment clearly visible",
  hoodie: "framed from the top of his head to mid-thigh, the whole garment clearly visible",
  jacket: "framed from the top of his head to the knees, the whole garment clearly visible",
  trouser: "full length from head to shoes, the trousers clearly visible, worn with a plain top",
  tie: "framed from the chest up, wearing a crisp shirt with the tie neatly knotted",
  gloves: "framed on his gloved hands resting on the motorcycle's handlebar, his face out of frame",
};

const firstSentence = (s) => (s.match(/^[^.]+\./) ?? [s])[0];

// What the garment is, in plain words. The product's own name is never put in a
// prompt: image tools tend to print quoted names onto the clothes.
const NOUN = {
  tee: "T-shirt",
  cargo: "cargo trousers",
  pant: "trousers",
  trouser: "trousers",
  jeans: "jeans",
  denim: "riding jeans",
  chino: "chinos",
  rugby: "rugby shirt",
  layer: "base-layer top",
  gloves: "riding gloves",
  suit: "two-piece suit",
  tie: "knitted silk tie",
};
// two-word endings that say more than the last word alone
const NOUN2 = {
  "coach jacket": "coach jacket",
  "varsity jacket": "varsity jacket",
  "riding jacket": "riding jacket",
  "mesh jacket": "mesh riding jacket",
  "rain shell": "rain shell jacket",
  "track pant": "track pants",
  "riding pant": "cargo riding trousers",
  "wide jeans": "wide-leg jeans",
  "camp shirt": "camp-collar shirt",
  "dress shirt": "dress shirt",
  "spread-collar shirt": "spread-collar shirt",
  "knit polo": "cable-knit polo",
  "cable sweater": "cable-knit cricket sweater",
};
export function garmentNoun(name) {
  const words = name.toLowerCase().split(" ");
  const two = words.slice(-2).join(" ");
  return NOUN2[two] ?? NOUN[words.at(-1)] ?? words.at(-1);
}

/** The two prompts for a product: 1 = worn, 2 = fabric close-up. Uses the product's first colour. */
export function promptsFor(p) {
  const s = SHOOT[p.collection];
  if (!s) throw new Error(`No shoot style for collection "${p.collection}"`);
  const colour = p.colours[0];
  const kind = garmentKind(p.name);
  const what = `a ${colour.toLowerCase()} ${garmentNoun(p.name)}: ${firstSentence(p.description)} Fabric: ${p.fabric}.`;
  const front = [
    STYLE,
    `Subject: ${s.model}, wearing ${what}`,
    `Framing: ${FRAMING[kind]}.`,
    `Setting: ${s.set}.`,
    `Lighting: ${s.light}.`,
    `Mood: ${s.mood}.`,
    RULES,
  ].join("\n");
  const detail = [
    STYLE,
    `A close-up detail shot of ${what}, worn by a man, showing the fabric texture, stitching and finish up close.`,
    "Framing: tight crop on the garment only, his face not in frame.",
    `Setting: the same place, softly out of focus: ${s.set}.`,
    `Lighting: ${s.light}.`,
    RULES,
  ].join("\n");
  return { front, detail };
}

/** Alt text for each photo slot (screen readers and Google read these). */
export function altFor(p, n) {
  return n === 1
    ? `${p.name} in ${p.colours[0]}, worn by a model`
    : `${p.name}, close-up of the fabric and finish`;
}

export const PHOTO_SIZE = { width: 1200, height: 1600 };
export const ACCEPTED = /\.(jpe?g|png|webp|avif)$/i;

/**
 * Which photo files go to which product. Expects photos/<product-slug>/1.jpg
 * (worn) and photos/<product-slug>/2.jpg (close-up), any of jpg/png/webp/avif.
 * `files` are paths relative to the photos folder, with "/" separators.
 */
export function planImport(files, products) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const plan = new Map();
  const problems = [];
  for (const f of files) {
    const parts = f.split("/");
    if (parts.length !== 2 || parts[1].startsWith(".")) {
      if (!parts.at(-1).startsWith("."))
        problems.push(
          `${f}: put photos in a folder named after the product, like static-heavy-tee/1.jpg`,
        );
      continue;
    }
    const [slug, file] = parts;
    const m = file.match(/^([12])\.(jpe?g|png|webp|avif)$/i);
    if (!bySlug.has(slug)) {
      problems.push(
        `${f}: no product called "${slug}" (folder names must match the product's web address)`,
      );
      continue;
    }
    if (!m) {
      problems.push(`${f}: name it 1.jpg (worn) or 2.jpg (close-up); jpg, png, webp or avif`);
      continue;
    }
    const n = Number(m[1]);
    const entry = plan.get(slug) ?? { product: bySlug.get(slug), photos: {} };
    if (entry.photos[n]) {
      problems.push(`${slug}: two files for photo ${n} (${entry.photos[n]} and ${f}); keep one`);
      continue;
    }
    entry.photos[n] = f;
    plan.set(slug, entry);
  }
  for (const [slug, e] of plan)
    if (!e.photos[1])
      problems.push(
        `${slug}: has a close-up (2) but no worn photo (1); the worn photo is the main one`,
      );
  return { plan, problems };
}

/** Storage path with a short content hash, so a new photo never shows an old cached one. */
export function storagePath(slug, n, hash) {
  return `${slug}/${n}-${hash.slice(0, 10)}.avif`;
}
