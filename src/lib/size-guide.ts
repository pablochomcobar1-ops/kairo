import { garmentKind } from "./images";

/** Body measurements in cm (gloves: palm circumference). One place for the dialog and the /size-guide page (Task 11). */
export interface SizeTable {
  title: string;
  note: string;
  columns: string[];
  rows: string[][];
}

export const SIZE_TABLES = {
  tops: {
    title: "Tops, knits and jackets",
    note: "Measure around the fullest part of your chest. Between sizes? Size up for a relaxed fit.",
    columns: ["Size", "Chest (cm)", "Length (cm)", "Shoulder (cm)"],
    rows: [
      ["S", "92–97", "69", "44"],
      ["M", "98–103", "71", "46"],
      ["L", "104–109", "73", "48"],
      ["XL", "110–116", "75", "50"],
      ["XXL", "117–123", "77", "52"],
    ],
  },
  bottoms: {
    title: "Trousers, denim and cargos",
    note: "Sizes are waist in inches. Measure where you normally wear your waistband.",
    columns: ["Size", "Waist (cm)", "Hip (cm)", "Inseam (cm)"],
    rows: [
      ["30", "76", "96", "78"],
      ["32", "81", "101", "79"],
      ["34", "86", "106", "80"],
      ["36", "91", "111", "81"],
      ["38", "96", "116", "81"],
    ],
  },
  tailoring: {
    title: "Suits and blazers",
    note: "Jacket sizes are chest in inches. The trousers of a suit come with the matching waist.",
    columns: ["Size", "Chest (in)", "Chest (cm)", "Sleeve (cm)"],
    rows: [
      ["38", "38", "97", "62"],
      ["40", "40", "102", "63"],
      ["42", "42", "107", "64"],
      ["44", "44", "112", "65"],
      ["46", "46", "117", "66"],
    ],
  },
  gloves: {
    title: "Gloves",
    note: "Wrap a tape around your palm just below the knuckles, without the thumb.",
    columns: ["Size", "Palm (cm)", "Hand length (cm)"],
    rows: [
      ["S", "19–20", "17–18"],
      ["M", "21–22", "18–19"],
      ["L", "23–24", "19–20"],
      ["XL", "25–26", "20–21"],
    ],
  },
} satisfies Record<string, SizeTable>;

export type SizeTableId = keyof typeof SIZE_TABLES;

/** Which table fits a product, from its sizes (and name for gloves); null for one-size pieces. */
export function sizeTableFor(name: string, sizes: string[]): SizeTableId | null {
  if (sizes.length === 0 || sizes.every((s) => s === "ONE")) return null;
  if (garmentKind(name) === "gloves") return "gloves";
  if (sizes.some((s) => ["40", "42", "44", "46"].includes(s))) return "tailoring";
  if (sizes.every((s) => /^\d+$/.test(s))) return "bottoms";
  return "tops";
}
